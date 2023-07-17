import sys
import stanza
from stanza.pipeline.core import DownloadMethod
nlp = stanza.Pipeline(sys.argv[1], processors='tokenize,pos,lemma', tokenize_no_ssplit=True, download_method=DownloadMethod.REUSE_RESOURCES)
doc = nlp(sys.argv[2])
print(doc.sentences)
sys.exit()