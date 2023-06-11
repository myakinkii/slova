# slova.cc
We are yet to decide what it actually is, but it has something to do with words

# how to run
* clone and `npm install`
* (optional) download some data sets from https://universaldependencies.org and put into `test/conllu`
* and set CONLLU_SETS in `.env` file to reference them (eg `CONLLU_SETS=cu_proiel,en_gum`)
* (also optionally) set IMPORT_POS to import specific parts of speech (eg `IMPORT_POS=NOUN,VERB`)
* run `cds run --in-memory` and proceed to http://localhost:4004/flp/index.html

POS tags and Features follow this guide https://universaldependencies.org/guidelines.html

## to enable stanza syntax parsing
follow `./srv/lib/stanza/README.md`