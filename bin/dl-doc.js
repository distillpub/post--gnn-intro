/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

var fs = require('fs')
var doc2txt = require('doc2txt')
var marked = require('marked')
marked.setOptions({smartypants: true})

async function main(){
  var opts = {
    startstr: '::startpost::',
    endstr: '::endpost::',
    fmt: 'md',
  }
  var docstr = await doc2txt('1709_COGJ9IFjoZsBVdQSnUJaetJgwGTkydrUWrS_c20', opts)
  var htmlstr = marked(docstr)
    .replace('<p><d-footnote-list></d-footnote-list></p>', '<d-footnote-list></d-footnote-list>')
    .replace('<p><d-citation-list></d-citation-list>', '<d-citation-list></d-citation-list>')


  var path = __dirname + '/../index.html'

  var prev = fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : ''
    
  if (htmlstr != prev){
    fs.writeFileSync(path, htmlstr)
    console.log('changed', new Date())
  }

  // Comment out to debug the doc -> html -> markdown pipeline
  // fs.writeFileSync(__dirname + '/docstr.md', docstr)


}
console.log(`Unliked from doc - directly edit https://github.com/distillpub/post--gnn-intro/blob/main/index.html instead`)
// main().catch(console.error)
