### GNN-distill
This is the repo for a distill post on graph neural nets


### To run the demo

1. Install dependencies:

```
yarn
```

2. Watch the demo for changes with a local server:

```
yarn start
```

The demo can then be accessed at http://localhost:1234/


### To download latest edits from gdrive onto index.html

Get a credentials.json and install libraries following steps 1 & 2 from [gdrive quickstart](https://developers.google.com/drive/api/v3/quickstart/python).

Default location for credentials.json is `~/.doc2txt-credentials.json`.

To pull down a new copy of the google doc and rerender the html:

```
node bin/dl-doc.js
```

To update the doc continuously:

```
bin/watch-doc.sh
```


NB: This is not an official Google product.
