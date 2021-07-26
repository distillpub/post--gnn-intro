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


export class Table {
  constructor() {
    document.getElementById('table').innerHTML =
      `
      <div class=table-holder>

        <div class='row'>
          <div class='spacer'></div>
          <div class='degree'>
            Edges per node (degree)
          </div>
        </div>
      
        <div class='row header'>
          <div> Dataset </div>
          <div> Domain </div>
          <div> graphs </div>
          <div> nodes </div>
          <div> edges </div>
          <div> min </div>
          <div> mean </div>
          <div> max </div>
        </div>

        <div class='row'>
          <div> karate club</div>
          <div> Social network </div>
          <div> 1 </div>
          <div> 34 </div>
          <div> 78 </div>
          <div>  </div>
          <div> 4.5 </div>
          <div> 17 </div>
        </div>

        <div class='row'>
          <div> qm9 </div>
          <div> Small molecules </div>
          <div> 134k </div>
          <div> ≤ 9 </div>
          <div> ≤26 </div>
          <div> 1 </div>
          <div> 2 </div>
          <div> 5 </div>
        </div>

        <div class='row'>
          <div> Cora </div>
          <div> Citation network </div>
          <div> 1 </div>
          <div> 23,166 </div>
          <div> 91,500 </div>
          <div> 1 </div>
          <div> 7.8 </div>
          <div> 379 </div>
        </div>

        <div class='row'>
          <div> Wikipedia links, English </div>
          <div> Knowledge graph </div>
          <div> 1 </div>
          <div> 12M </div>
          <div> 378M </div>
          <div>  </div>
          <div> 62.24 </div>
          <div> 1M </div>
        </div>


      </div>
      `;
  }
}