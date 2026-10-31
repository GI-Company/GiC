"""Local website-broker to Python-engine qualification; no real GIC accounts."""
import argparse
import hashlib
import json
from pathlib import Path
import selectors
import socket
import subprocess
import sys
import time

import httpx
from cryptography.hazmat.primitives import serialization


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--engine-source',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args = parser.parse_args()
    args.engine_source=args.engine_source.resolve()
    args.output=args.output.resolve()
    args.output.mkdir(parents=True,mode=0o700,exist_ok=False)
    sys.path.insert(0,str(args.engine_source.resolve()))
    from scripts.research_service_fixture import seed_synthetic_fixture, ISSUER, AUDIENCE
    from scripts.verify_research_service import fingerprints
    fixture = seed_synthetic_fixture(args.output/'fixture')
    before = fingerprints(fixture.root)
    with socket.socket() as sock:
        sock.bind(('127.0.0.1',0)); port=sock.getsockname()[1]
    checks = {}
    processes = []
    with (args.output/'service.log').open('wb') as log:
        service = subprocess.Popen([sys.executable,'-m','virtual_lab.integrations.research_service.server',
            '--root',str(fixture.root),'--policy',str(fixture.policy_path),'--identity',str(fixture.identity_path),
            '--audit',str(fixture.audit_path),'--port',str(port)],cwd=args.engine_source,stdout=log,stderr=log)
        processes.append(service)
        try:
            service_origin=f'http://127.0.0.1:{port}'
            deadline=time.monotonic()+20
            while time.monotonic()<deadline:
                if service.poll() is not None: raise RuntimeError('Research service exited')
                try:
                    if httpx.get(service_origin+'/v1/projects',trust_env=False,timeout=.5).status_code==401: break
                except httpx.TransportError: pass
                time.sleep(.1)
            else: raise RuntimeError('Service readiness deadline')
            broker = subprocess.Popen(['node','scripts/research-reader-http.cjs','--synthetic-qualification'],
                stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=log,text=True)
            processes.append(broker)
            # Ephemeral signing key crosses stdin only: no key files or CLI arguments.
            config={'enabled':True,'serviceOrigin':service_origin,'issuer':ISSUER,'audience':AUDIENCE,
                'keyId':'fixture-key','privateKey':fixture.private_key.private_bytes(serialization.Encoding.PEM,
                    serialization.PrivateFormat.PKCS8,serialization.NoEncryption()).decode()}
            broker.stdin.write(json.dumps(config)); broker.stdin.close(); del config
            selector=selectors.DefaultSelector(); selector.register(broker.stdout,selectors.EVENT_READ)
            if not selector.select(timeout=10): raise RuntimeError('Broker readiness deadline')
            broker_port=json.loads(broker.stdout.readline(2048))['port']; selector.close()
            website_origin=f'http://127.0.0.1:{broker_port}'
            route='/api/virtual-lab/research/'+fixture.report_url.removeprefix('/v1/')
            with httpx.Client(base_url=website_origin,headers={'Authorization':'Bearer synthetic-session-a'},trust_env=False) as website:
                response=website.get(route); assert response.status_code==200,response.text
                direct=httpx.get(service_origin+fixture.report_url,headers={'Authorization':'Bearer '+fixture.token()},trust_env=False)
                assert response.content==direct.content
                assert response.headers['x-content-sha256']==hashlib.sha256(direct.content).hexdigest()
                checks.update(website_broker_and_engine_same_report=True,report_sha256_matches=True)
                assert website.get(route,headers={'Authorization':'Bearer synthetic-session-b'}).status_code==404
                assert website.get(route,headers={'Authorization':''}).status_code==401
                checks.update(cross_account_denial=True,anonymous_denial=True)
                policy=json.loads(fixture.policy_path.read_bytes()); policy['grants']=policy['grants'][1:]
                fixture.policy_path.write_text(json.dumps(policy))
                assert website.get(route).status_code==404
                assert httpx.get(service_origin+fixture.report_url,headers={'Authorization':'Bearer '+fixture.token()},trust_env=False).status_code==404
                checks['revocation_on_both_clients']=True
                (args.output/'verified-report.json').write_bytes(response.content)
        finally:
            for process in reversed(processes):
                process.terminate()
                try: process.wait(timeout=10)
                except subprocess.TimeoutExpired: process.kill();process.wait()
    assert before==fingerprints(fixture.root)
    checks['research_files_unchanged']=True
    result={'format':'virtuallab-website-reader-qualification-v1','passed':all(checks.values()),'checks':checks,
        'report_sha256':hashlib.sha256(response.content).hexdigest(),
        'actual_gic_sign_in_tested':False,'actual_chatgpt_tested':False,'deployed':False,
        'scope':'Loopback website-broker/Python-engine integration using synthetic identity stubs; not hosted-account acceptance.'}
    (args.output/'validation.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result))


if __name__=='__main__': main()
