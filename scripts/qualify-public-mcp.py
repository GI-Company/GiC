"""Test fixed public MCP tools through the real Streamable HTTP SDK transport."""
import argparse
import asyncio
import copy
import importlib.metadata
import json
from pathlib import Path
from urllib.parse import urlsplit

import httpx
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
from mcp.shared.exceptions import McpError


async def qualify(url):
    checks = {}
    presets = {}
    async with streamablehttp_client(url) as (read,write,_):
        async with ClientSession(read,write) as session:
            initialized=await session.initialize()
            listed=await session.list_tools()
            assert {t.name for t in listed.tools}=={'describe_free_virtual_lab','run_public_reference','verify_public_reference','verify_public_report'}
            checks['sdk_initialization_and_exact_tool_allowlist']=True
            info=json.loads((await session.call_tool('describe_free_virtual_lab',{})).content[0].text)
            assert info['publicOnly'] and info['state']['outputs']=='SIMULATED'
            for preset in ('stimulus','mrna_decay','protein_decay'):
                output=json.loads((await session.call_tool('run_public_reference',{'preset':preset})).content[0].text)
                assert output['mode']=='SIMULATED' and len(output['results'])==3
                verified=json.loads((await session.call_tool('verify_public_reference',{'preset':preset,'sha256':output['sha256']})).content[0].text)
                altered=json.loads((await session.call_tool('verify_public_reference',{'preset':preset,'sha256':'0'*64})).content[0].text)
                assert verified['matches'] is True and altered['matches'] is False
                assert verified['reportVerified'] is False
                full=json.loads((await session.call_tool('verify_public_report',{'preset':preset,'artifact':output})).content[0].text)
                assert full['matches'] is True and full['reportVerified'] is True and full['signed'] is False
                tampered=copy.deepcopy(output)
                tampered['results'][1]['finalProtein']=999999
                checked=json.loads((await session.call_tool('verify_public_report',{'preset':preset,'artifact':tampered})).content[0].text)
                assert checked['matches'] is False and checked['digestMatches'] is False
                tampered=copy.deepcopy(output)
                tampered['report']=tampered['report'].replace('SIMULATED','MEASURED')
                checked=json.loads((await session.call_tool('verify_public_report',{'preset':preset,'artifact':tampered})).content[0].text)
                assert checked['matches'] is False
                presets[preset]=output['sha256']
            checks['all_fixed_presets_and_checksum_positive_negative']=True
            checks['complete_report_positive_and_altered_numbers_text_negative']=True
            for preset,sha256 in presets.items():
                upper=json.loads((await session.call_tool('verify_public_reference',{'preset':preset,'sha256':sha256.upper()})).content[0].text)
                assert upper['matches'] is True
                for other,digest in presets.items():
                    if other==preset:continue
                    crossed=json.loads((await session.call_tool('verify_public_reference',{'preset':preset,'sha256':digest})).content[0].text)
                    assert crossed['matches'] is False
            checks['uppercase_accepted_and_all_cross_preset_digests_rejected']=True
            for name,args,code in [('get_private_project',{},-32601),('run_public_reference',{'preset':'__proto__'},-32602)]:
                try: await session.call_tool(name,args)
                except McpError as error: assert error.error.code==code
                else: raise AssertionError('Unauthorized/invalid operation accepted')
            checks['private_tool_and_invalid_preset_rejected']=True
    with httpx.Client(trust_env=False,timeout=10) as client:
        response=client.post(url,headers={'Content-Type':'application/json','Accept':'application/json, text/event-stream',
            'Origin':'https://attacker.invalid'},json={'jsonrpc':'2.0','id':1,'method':'tools/list'})
        assert response.status_code==403
        checks['cross_origin_rejected']=True
        headers={'Content-Type':'application/json','Accept':'application/json, text/event-stream'}
        for args in ({},{'preset':'../../../private/lab'},{'preset':'stimulus; touch /tmp/not-executed'},
                     {'preset':'stimulus','project_id':'private'},{'preset':['stimulus']}):
            response=client.post(url,headers=headers,json={'jsonrpc':'2.0','id':1,'method':'tools/call',
                'params':{'name':'run_public_reference','arguments':args}})
            assert response.status_code==200 and response.json()['error']['code']==-32602
        checks['raw_http_invalid_inputs_rejected_independent_of_client_schema']=True
        for body,extra in [(b'x'*4097,{}),('é'.encode()*2049,{}),(b'{}',{'Content-Encoding':'gzip'})]:
            response=client.post(url,headers={**headers,**extra},content=body)
            assert response.status_code==(415 if extra else 413)
        response=client.post(url,headers=headers,content=iter([b'x'*2048,b'x'*2049]))
        assert response.status_code==413
        checks['raw_http_byte_limit_and_chunked_body_rejection']=True
    return {'format':'virtuallab-public-mcp-qualification-v1','passed':all(checks.values()),'checks':checks,
        'presets_sha256':presets,'protocol_version':initialized.protocolVersion,'python_mcp_sdk':importlib.metadata.version('mcp'),
        'endpoint':url,'actual_chatgpt_tested':False,'submitted':False,'published':False,
        'rate_limiting_verified':False,
        'scope':'SDK and raw HTTP qualification of fixed public simulated reference tools; not a load test, rate-limit qualification, digital signature, OpenAI tool scan, domain verification or ChatGPT acceptance.'}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url',required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    url=urlsplit(args.url)
    if (url.scheme!='https' and not (url.scheme=='http' and url.hostname=='127.0.0.1')) or url.username or url.password or url.query or url.fragment or url.path!='/api/virtual-lab/mcp':
        parser.error('Use an HTTPS endpoint or explicit loopback test URL, without credentials or query')
    result=asyncio.run(qualify(args.url))
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'passed':result['passed'],'checks':result['checks'],'evidence':str(args.output)}))


if __name__=='__main__':main()
