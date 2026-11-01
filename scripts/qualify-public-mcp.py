"""Test fixed public MCP tools through the real Streamable HTTP SDK transport."""
import argparse
import asyncio
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
            assert {t.name for t in listed.tools}=={'describe_free_virtual_lab','run_public_reference','verify_public_reference'}
            checks['sdk_initialization_and_exact_tool_allowlist']=True
            info=json.loads((await session.call_tool('describe_free_virtual_lab',{})).content[0].text)
            assert info['publicOnly'] and info['state']['outputs']=='SIMULATED'
            for preset in ('stimulus','mrna_decay','protein_decay'):
                output=json.loads((await session.call_tool('run_public_reference',{'preset':preset})).content[0].text)
                assert output['mode']=='SIMULATED' and len(output['results'])==3
                verified=json.loads((await session.call_tool('verify_public_reference',{'preset':preset,'sha256':output['sha256']})).content[0].text)
                altered=json.loads((await session.call_tool('verify_public_reference',{'preset':preset,'sha256':'0'*64})).content[0].text)
                assert verified['matches'] is True and altered['matches'] is False
                presets[preset]=output['sha256']
            checks['all_fixed_presets_and_checksum_positive_negative']=True
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
    return {'format':'virtuallab-public-mcp-qualification-v1','passed':all(checks.values()),'checks':checks,
        'presets_sha256':presets,'protocol_version':initialized.protocolVersion,'python_mcp_sdk':importlib.metadata.version('mcp'),
        'endpoint':url,'actual_chatgpt_tested':False,'submitted':False,'published':False,
        'scope':'SDK HTTP qualification of fixed public simulated reference tools; not OpenAI tool scan, domain verification or ChatGPT acceptance.'}


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
