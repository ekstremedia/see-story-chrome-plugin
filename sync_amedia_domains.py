"""Regenerate manifest.json's optional_host_permissions from amedia-domains.tsv.

amedia-domains.tsv is the source of truth for the Amedia auto-apply feature
(see its header for what qualifies a domain). After editing that file:

Run: python3 sync_amedia_domains.py

Rewrites just that one array as text, rather than round-tripping the whole
file through json.load/dump, so it doesn't reformat the rest of manifest.json.
"""
import json
import re


def main():
    domains = []
    for line in open("amedia-domains.tsv", encoding="utf-8"):
        line = line.split("#", 1)[0].strip()
        if not line:
            continue
        domain = line.split("\t", 1)[0].strip()
        domains.append(domain)

    origins = [f"*://*.{d}/*" for d in sorted(domains)]
    json.load(open("manifest.json"))  # fail loudly on a hand-edit that broke the JSON

    text = open("manifest.json", encoding="utf-8").read()
    array = "[\n" + "".join(f'    "{o}",\n' for o in origins)[:-2] + "\n  ]"
    new_text, n = re.subn(
        r'"optional_host_permissions":\s*\[[^\]]*\]',
        f'"optional_host_permissions": {array}',
        text,
        count=1,
    )
    if n != 1:
        raise SystemExit('manifest.json has no "optional_host_permissions" key to replace')

    open("manifest.json", "w", encoding="utf-8").write(new_text)
    json.load(open("manifest.json"))  # confirm the result still parses
    print(f"manifest.json: {len(domains)} optional_host_permissions")


if __name__ == "__main__":
    main()
