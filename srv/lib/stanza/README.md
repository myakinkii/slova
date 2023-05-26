### To setup [stanza](https://stanfordnlp.github.io/stanza/http:// "stanza")
in `SOME_DIR` create a [virtual env](http://https://packaging.python.org/en/latest/tutorials/installing-packages/#creating-virtual-environments "virtual env"):
```
python3 -m venv ./
source ./bin/activate
```
then install stanza:
```
pip install stanza
pip install "urllib3<=1.26.15"
```
urllib3 below version 2 is required because of ssl

### To point cap to stanza model
in `.env`:
```
LOCAL_STANZA=/FULL_PATH_TO_THAT_SOME_DIR
```
[PythonShell](http://https://www.npmjs.com/package/python-shell "PythonShell") will use it as `pythonPath`

### parse.py
Just does pretty simple stuff by taking one sentence as input each time and stdout'ing the found tokens
It can be run from shell as well (eg from cap project root):
```
source /FULL_PATH_TO_THAT_SOME_DIR/bin/activate
python srv/lib/stanza/parse.py en 'The quick brown fox jumps over the lazy dog'
```
