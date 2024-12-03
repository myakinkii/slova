# slova.cc
~~We are yet to decide what it actually is, but it has something to do with words~~

Ok, this stuff could potentially help you to learn new language by working with texts and then memorizing words from them.

# What it does?
Some info here shall give you most current impression of the purpose and features: https://slova.cc

# How to run locally
Run stuff as expected
* clone and `npm install`
* run `cds run --in-memory` and proceed to http://localhost:4004/flp/index.html
  
## Initially it was more of a connlu sets browser
* (optional) download some data sets from https://universaldependencies.org and put into `test/conllu`
* and set CONLLU_SETS in `.env` file to reference them (eg `CONLLU_SETS=cu_proiel,en_gum`)
* (also optionally) set IMPORT_POS to import specific parts of speech (eg `IMPORT_POS=NOUN,VERB`)

POS tags and Features follow this guide https://universaldependencies.org/guidelines.html

## Then we figured out that stanza syntax parsing could be used
Follow `./srv/lib/stanza/README.md` to set it up

## And just for fun we tried to enable openai text generation
Just add your OPENAI_API_KEY to `.env` as you would expect

## Also ugly flashcards mobile app companion can be built
Follow `./app/cards/README.md`
