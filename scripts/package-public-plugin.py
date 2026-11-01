"""Build the reviewed public-only plugin ZIP; this does not submit or publish it."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
FILES = ('plugin.json', 'mcp.json', 'README-SUBMISSION.txt', 'skills/get-started/SKILL.md',
         'assets/icon.svg', 'assets/logo.svg')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'output/public-plugin')
    args = parser.parse_args()
    source = ROOT / 'integrations/virtual-lab-free'
    metadata = json.loads((source / 'plugin.json').read_bytes())
    connection = json.loads((source / 'mcp.json').read_bytes())
    server = connection['mcpServers']['virtual-lab-free']
    assert set(server) == {'type', 'url'} and server['type'] == 'streamable-http'
    assert server['url'] == 'https://www.globalintentcompany.space/api/virtual-lab/mcp'
    assert metadata['name'] == 'virtual-lab-free' and metadata['version'] == '0.1.2'
    args.output_dir.mkdir(parents=True, exist_ok=True)
    output = args.output_dir / 'virtual-lab-free-plugin-0.1.2.zip'
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for name in FILES:
            entry = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, (source / name).read_bytes())
    with zipfile.ZipFile(output) as archive:
        assert archive.testzip() is None and set(archive.namelist()) == set(FILES)
        assert all(archive.read(name) == (source / name).read_bytes() for name in FILES)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    output.with_suffix('.zip.sha256').write_text(digest + '  ' + output.name + '\n')
    print(json.dumps({'zip': str(output), 'files': len(FILES), 'sha256': digest,
                     'submitted': False, 'published': False,
                     'portal_validation': 'not run; deploy and rescan the matching server first'}))


if __name__ == '__main__':
    main()
