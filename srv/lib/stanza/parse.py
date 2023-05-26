import sys
import stanza
from stanza.pipeline.core import DownloadMethod
nlp = stanza.Pipeline(sys.argv[1], processors='tokenize,pos,lemma', download_method=DownloadMethod.REUSE_RESOURCES)
doc = nlp(sys.argv[2])
print(doc.sentences[0])
sys.exit()