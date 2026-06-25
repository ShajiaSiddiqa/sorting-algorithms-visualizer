(function(){
  "use strict";

  var config = window.SORT_VISUALIZER;
  var arr = (config.initial || [29,10,14,37,13,21,6,25]).slice();
  var steps = [];
  var cur = 0;
  var playing = false;
  var timer = null;
  var codeEl = document.getElementById("code");
  var viewEl = document.getElementById("bars");
  var stackEl = document.getElementById("stack");
  var playBtn = document.getElementById("playBtn");
  var barCols = [];

  config.code.forEach(function(line, ix){
    var d = document.createElement("div");
    d.className = "ln";
    d.dataset.line = ix + 1;
    d.innerHTML = '<span class="n">'+(ix+1)+'</span><span>'+line+'</span>';
    codeEl.appendChild(d);
  });
  var codeLines = Array.prototype.slice.call(codeEl.querySelectorAll(".ln"));

  function safe(text){
    return String(text).replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
    });
  }
  function labelOne(i,t){ var o={}; o[i]=t; return o; }
  function labelPair(i,t,j,u){ var o={}; o[i]=t; o[j]=u; return o; }
  function sortedFlags(n,on){ var a=[]; for(var i=0;i<n;i++) a.push(!!on); return a; }

  function buildSteps(input){
    var a = input.slice();
    steps = [];
    var sorted = sortedFlags(a.length,false);
    var comparisons = 0, writes = 0, passes = 0;

    function snap(extra){
      var s = {
        array:a.slice(), sorted:sorted.slice(), range:null, compare:null, swap:null,
        focus:[], pivotIndex:-1, labels:{}, line:0, desc:"",
        comparisons:comparisons, writes:writes, passes:passes,
        buckets:null, output:null, counts:null, mode:config.view || "bars"
      };
      for(var k in extra){ s[k]=extra[k]; }
      steps.push(s);
    }
    function swap(i,j){ var t=a[i]; a[i]=a[j]; a[j]=t; writes++; }
    function markAllSorted(){ for(var i=0;i<sorted.length;i++) sorted[i]=true; }

    snap({desc:"Press <b>Play</b> to begin sorting."});

    if(config.algorithm === "bubble"){
      for(var end=a.length-1; end>0; end--){
        passes++;
        snap({line:2, range:[0,end], desc:"Pass "+passes+" bubbles the largest remaining value toward index "+end+"."});
        var changed = false;
        for(var i=0;i<end;i++){
          comparisons++;
          snap({line:3, range:[0,end], compare:[i,i+1], labels:labelPair(i,"left",i+1,"right"), desc:"Compare neighbours A["+i+"] = "+a[i]+" and A["+(i+1)+"] = "+a[i+1]+"."});
          if(a[i] > a[i+1]){
            var left=a[i], right=a[i+1];
            swap(i,i+1); changed = true;
            snap({line:5, range:[0,end], swap:[i,i+1], labels:labelPair(i,"swap",i+1,"swap"), desc:"Swap "+left+" and "+right+" because the pair is reversed."});
          } else {
            snap({line:4, range:[0,end], compare:[i,i+1], desc:"This pair is already ordered."});
          }
        }
        sorted[end] = true;
        snap({line:6, range:[0,end], pivotIndex:end, desc:"Index "+end+" is locked into the sorted suffix."});
        if(!changed){
          for(var s=0;s<=end;s++) sorted[s]=true;
          snap({line:7, range:[0,end], desc:"No swaps happened, so the array is sorted early."});
          break;
        }
      }
      markAllSorted();
    }

    if(config.algorithm === "selection"){
      for(var i=0;i<a.length-1;i++){
        passes++;
        var min = i;
        snap({line:2, range:[i,a.length-1], pivotIndex:min, labels:labelOne(min,"min"), desc:"Treat index "+i+" as the minimum, then scan the unsorted suffix."});
        for(var j=i+1;j<a.length;j++){
          comparisons++;
          snap({line:4, range:[i,a.length-1], pivotIndex:min, compare:[min,j], labels:labelPair(min,"min",j,"scan"), desc:"Compare current minimum "+a[min]+" with A["+j+"] = "+a[j]+"."});
          if(a[j] < a[min]){
            min = j;
            snap({line:5, range:[i,a.length-1], pivotIndex:min, labels:labelOne(min,"min"), desc:"A["+j+"] becomes the new minimum."});
          }
        }
        if(min !== i){
          var before=a[min];
          swap(i,min);
          snap({line:6, range:[i,a.length-1], swap:[i,min], labels:labelPair(i,"place",min,"swap"), desc:"Swap the minimum "+before+" into index "+i+"."});
        } else {
          snap({line:6, range:[i,a.length-1], pivotIndex:i, desc:"The minimum is already in the next sorted slot."});
        }
        sorted[i] = true;
        snap({line:7, range:[i,a.length-1], pivotIndex:i, desc:"Index "+i+" is now part of the sorted prefix."});
      }
      markAllSorted();
    }

    if(config.algorithm === "insertion"){
      if(a.length) sorted[0] = true;
      snap({line:1, range:[0,0], desc:"The first item is a sorted one-element prefix."});
      for(var i=1;i<a.length;i++){
        passes++;
        var key = a[i], j = i - 1;
        snap({line:2, range:[0,i], pivotIndex:i, labels:labelOne(i,"key"), desc:"Take key "+key+" and insert it into the sorted prefix."});
        while(j>=0){
          comparisons++;
          snap({line:4, range:[0,i], compare:[j,j+1], pivotIndex:j+1, labels:labelPair(j,"check",j+1,"key"), desc:"Compare A["+j+"] = "+a[j]+" with key "+key+"."});
          if(a[j] > key){
            a[j+1] = a[j]; writes++;
            snap({line:5, range:[0,i], swap:[j,j+1], labels:labelPair(j,"move",j+1,"move"), desc:"Shift "+a[j]+" one slot to the right."});
            j--;
          } else {
            snap({line:4, range:[0,i], compare:[j,j+1], desc:"The key belongs after index "+j+"."});
            break;
          }
        }
        a[j+1] = key; writes++;
        for(var p=0;p<=i;p++) sorted[p]=true;
        snap({line:6, range:[0,i], pivotIndex:j+1, labels:labelOne(j+1,"key"), desc:"Place key "+key+" at index "+(j+1)+"."});
      }
      markAllSorted();
    }

    if(config.algorithm === "merge"){
      for(var z=0;z<sorted.length;z++) sorted[z]=false;
      function mergeSort(lo,hi,depth){
        if(lo>=hi){
          if(lo===hi){
            sorted[lo]=true;
            snap({line:2, range:[lo,hi], labels:labelOne(lo,"base"), desc:"A one-item range is already sorted."});
          }
          return;
        }
        passes = Math.max(passes, depth+1);
        var mid=Math.floor((lo+hi)/2);
        snap({line:3, range:[lo,hi], focus:[mid], labels:labelOne(mid,"mid"), desc:"Split "+lo+"-"+hi+" at midpoint "+mid+"."});
        mergeSort(lo,mid,depth+1);
        mergeSort(mid+1,hi,depth+1);
        var left=a.slice(lo,mid+1), right=a.slice(mid+1,hi+1);
        snap({line:6, range:[lo,hi], output:a.slice(), buckets:[left.slice(),right.slice()], desc:"Merge left ["+left.join(", ")+"] and right ["+right.join(", ")+"]."});
        var i=0,j=0,k=lo;
        while(i<left.length && j<right.length){
          comparisons++;
          snap({line:8, range:[lo,hi], compare:[lo+i,mid+1+j], buckets:[left.slice(i),right.slice(j)], output:a.slice(), labels:labelPair(lo+i,"left",mid+1+j,"right"), desc:"Compare left front "+left[i]+" and right front "+right[j]+"."});
          a[k] = left[i] <= right[j] ? left[i++] : right[j++]; writes++;
          snap({line:9, range:[lo,hi], pivotIndex:k, buckets:[left.slice(i),right.slice(j)], output:a.slice(), labels:labelOne(k,"write"), desc:"Write the smaller front value into index "+k+"."});
          k++;
        }
        while(i<left.length){ a[k]=left[i++]; writes++; snap({line:10, range:[lo,hi], pivotIndex:k, buckets:[left.slice(i),right.slice(j)], output:a.slice(), labels:labelOne(k,"copy"), desc:"Copy the remaining left value into index "+k+"."}); k++; }
        while(j<right.length){ a[k]=right[j++]; writes++; snap({line:11, range:[lo,hi], pivotIndex:k, buckets:[left.slice(i),right.slice(j)], output:a.slice(), labels:labelOne(k,"copy"), desc:"Copy the remaining right value into index "+k+"."}); k++; }
        for(var q=lo;q<=hi;q++) sorted[q]=true;
        snap({line:12, range:[lo,hi], output:a.slice(), desc:"Range "+lo+"-"+hi+" is now merged."});
      }
      mergeSort(0,a.length-1,0);
      markAllSorted();
    }

    if(config.algorithm === "heap"){
      function heapify(n,i){
        var largest=i, l=2*i+1, r=2*i+2;
        snap({line:8, range:[0,n-1], pivotIndex:i, labels:labelOne(i,"root"), desc:"Heapify node "+i+" inside heap size "+n+"."});
        if(l<n){
          comparisons++;
          snap({line:9, range:[0,n-1], compare:[largest,l], labels:labelPair(largest,"largest",l,"left"), desc:"Compare left child "+a[l]+" with "+a[largest]+"."});
          if(a[l]>a[largest]) largest=l;
        }
        if(r<n){
          comparisons++;
          snap({line:10, range:[0,n-1], compare:[largest,r], labels:labelPair(largest,"largest",r,"right"), desc:"Compare right child "+a[r]+" with "+a[largest]+"."});
          if(a[r]>a[largest]) largest=r;
        }
        if(largest!==i){
          swap(i,largest);
          snap({line:12, range:[0,n-1], swap:[i,largest], labels:labelPair(i,"swap",largest,"max"), desc:"Swap the larger child upward to restore the heap."});
          heapify(n,largest);
        } else {
          snap({line:11, range:[0,n-1], pivotIndex:i, desc:"This subtree already satisfies the max-heap rule."});
        }
      }
      for(var i=Math.floor(a.length/2)-1;i>=0;i--){
        passes++;
        snap({line:2, range:[0,a.length-1], pivotIndex:i, desc:"Build heap by repairing subtree rooted at index "+i+"."});
        heapify(a.length,i);
      }
      snap({line:3, range:[0,a.length-1], desc:"The balanced tree now represents a max heap."});
      for(var end=a.length-1;end>0;end--){
        passes++;
        swap(0,end); sorted[end]=true;
        snap({line:5, range:[0,end], swap:[0,end], labels:labelPair(0,"root",end,"sorted"), desc:"Move the root maximum into final index "+end+"."});
        heapify(end,0);
      }
      markAllSorted();
    }

    if(config.algorithm === "counting"){
      var max=Math.max.apply(null,a.concat([0]));
      var counts=Array(max+1).fill(0), out=[];
      snap({line:2, counts:counts.slice(), output:out.slice(), desc:"Create a count array with one slot for each possible value."});
      for(var i=0;i<a.length;i++){
        passes++; counts[a[i]]++; writes++;
        snap({line:4, pivotIndex:i, labels:labelOne(i,"read"), counts:counts.slice(), output:out.slice(), desc:"Count value "+a[i]+". Its counter becomes "+counts[a[i]]+"."});
      }
      for(var v=0;v<counts.length;v++){
        while(counts[v]>0){
          counts[v]--; out.push(v); writes++;
          snap({line:7, focus:[v], counts:counts.slice(), output:out.slice(), desc:"Emit value "+v+" into the output array."});
        }
      }
      a = out.slice(); markAllSorted();
    }

    if(config.algorithm === "radix"){
      var maxR=Math.max.apply(null,a.concat([0]));
      for(var exp=1; Math.floor(maxR/exp)>0; exp*=10){
        passes++;
        var buckets=Array.from({length:10},function(){return [];});
        snap({line:2, buckets:buckets.map(function(b){return b.slice();}), desc:"Sort by the "+(exp===1?"ones":exp===10?"tens":"hundreds")+" digit."});
        for(var i=0;i<a.length;i++){
          var digit=Math.floor(a[i]/exp)%10;
          buckets[digit].push(a[i]); writes++;
          snap({line:5, pivotIndex:i, labels:labelOne(i,"digit "+digit), buckets:buckets.map(function(b){return b.slice();}), desc:"Place "+a[i]+" into digit bucket "+digit+"."});
        }
        a=[];
        for(var d=0;d<10;d++){
          while(buckets[d].length){
            a.push(buckets[d].shift()); writes++;
            snap({line:8, focus:[d], buckets:buckets.map(function(b){return b.slice();}), output:a.slice(), desc:"Collect bucket "+d+" back into the array."});
          }
        }
      }
      markAllSorted();
    }

    if(config.algorithm === "bucket"){
      var bucketCount=Math.min(5, Math.max(3, Math.ceil(Math.sqrt(a.length))));
      var maxB=Math.max.apply(null,a.concat([1]));
      var bucketsB=Array.from({length:bucketCount},function(){return [];});
      snap({line:2, buckets:bucketsB.map(function(b){return b.slice();}), desc:"Create "+bucketCount+" value-range buckets."});
      for(var i=0;i<a.length;i++){
        var bi=Math.min(bucketCount-1, Math.floor(a[i]/(maxB+1)*bucketCount));
        bucketsB[bi].push(a[i]); writes++;
        snap({line:4, pivotIndex:i, labels:labelOne(i,"bucket "+bi), buckets:bucketsB.map(function(b){return b.slice();}), desc:"Drop "+a[i]+" into bucket "+bi+"."});
      }
      for(var b=0;b<bucketsB.length;b++){
        passes++;
        bucketsB[b].sort(function(x,y){ comparisons++; return x-y; });
        snap({line:6, focus:[b], buckets:bucketsB.map(function(x){return x.slice();}), desc:"Sort bucket "+b+" locally."});
      }
      a=[];
      for(var b2=0;b2<bucketsB.length;b2++){
        for(var x=0;x<bucketsB[b2].length;x++){
          a.push(bucketsB[b2][x]); writes++;
          snap({line:7, focus:[b2], buckets:bucketsB.map(function(y){return y.slice();}), output:a.slice(), desc:"Concatenate bucket "+b2+" into the final array."});
        }
      }
      markAllSorted();
    }

    snap({line:0, range:[0,a.length-1], desc:"Sorted! The whole array is now in order.", sorted:sortedFlags(a.length,true), array:a.slice(), output:a.slice()});
  }

  function ensureBars(n){
    if(barCols.length===n && viewEl.className==="bars") return;
    viewEl.className = "bars";
    viewEl.innerHTML = "";
    barCols = [];
    for(var k=0;k<n;k++){
      var col=document.createElement("div");
      col.className="col"; col.setAttribute("role","button"); col.setAttribute("tabindex","0"); col.dataset.index=k;
      var val=document.createElement("div"); val.className="val";
      var track=document.createElement("div"); track.className="bar-track";
      var bar=document.createElement("div"); bar.className="bar";
      var idx=document.createElement("div"); idx.className="idx"; idx.textContent=k;
      var ptrs=document.createElement("div"); ptrs.className="ptrs";
      col.addEventListener("click",function(e){inspectItem(+e.currentTarget.dataset.index);});
      track.appendChild(bar); col.appendChild(val); col.appendChild(track); col.appendChild(idx); col.appendChild(ptrs);
      viewEl.appendChild(col); barCols.push({col:col,val:val,bar:bar,ptrs:ptrs});
    }
  }

  function classesFor(s,k){
    var cls=[];
    if(s.sorted[k]) cls.push("sorted");
    if(s.swap && (k===s.swap[0]||k===s.swap[1])) cls.push("move");
    if(s.compare && (k===s.compare[0]||k===s.compare[1])) cls.push("compare");
    if(k===s.pivotIndex || s.focus.indexOf(k)>=0) cls.push("focus");
    return cls;
  }

  function renderBars(s){
    ensureBars(s.array.length);
    var max=Math.max.apply(null,s.array.concat([1]));
    for(var k=0;k<s.array.length;k++){
      var p=barCols[k], inRange=s.range && k>=s.range[0] && k<=s.range[1];
      p.col.className="col";
      if(inRange && !s.sorted[k]) p.col.classList.add("inrange");
      if(!inRange && !s.sorted[k]) p.col.classList.add("dim");
      p.val.textContent=s.array[k];
      p.bar.style.height=Math.max(8,Math.round(s.array[k]/max*100))+"%";
      p.bar.className="bar";
      if(s.swap && (k===s.swap[0]||k===s.swap[1])) p.bar.classList.add("swap");
      else if(s.compare && (k===s.compare[0]||k===s.compare[1])) p.bar.classList.add("compare");
      else if(k===s.pivotIndex || s.focus.indexOf(k)>=0) p.bar.classList.add("pivot");
      else if(s.sorted[k]) p.bar.classList.add("sorted");
      p.ptrs.innerHTML=s.labels[k]?'<span class="tag show a">'+safe(s.labels[k])+"</span>":"";
    }
  }

  function renderArray(s){
    viewEl.className = "bars array-mode";
    viewEl.innerHTML = "";
    var wrap=document.createElement("div"); wrap.className="array-view";
    addArrayRow(wrap,"array",s.array,s);
    if(s.buckets){ addArrayRow(wrap,"left",s.buckets[0]||[],{labels:{},sorted:[],focus:[],compare:null,swap:null}); addArrayRow(wrap,"right",s.buckets[1]||[],{labels:{},sorted:[],focus:[],compare:null,swap:null}); }
    if(s.output){ addArrayRow(wrap,"output",s.output,{labels:{},sorted:sortedFlags(s.output.length,true),focus:[],compare:null,swap:null}); }
    viewEl.appendChild(wrap);
  }
  function addArrayRow(wrap,title,values,s){
    var row=document.createElement("div"); row.className="array-row";
    var lab=document.createElement("div"); lab.className="array-title"; lab.textContent=title; row.appendChild(lab);
    values.forEach(function(v,k){
      var c=document.createElement("div"), cls=classesFor(s,k);
      c.className="cell "+cls.join(" ");
      if(s.range && (k<s.range[0] || k>s.range[1])) c.classList.add("dim");
      c.innerHTML='<div class="num">'+safe(v)+'</div><div class="idx">'+k+'</div>';
      row.appendChild(c);
    });
    wrap.appendChild(row);
  }

  function renderHeap(s){
    viewEl.className = "bars heap-mode";
    viewEl.innerHTML = "";
    var heap=document.createElement("div"); heap.className="heap-view";
    var n=s.array.length, W=720;
    for(var i=1;i<n;i++){
      var p=Math.floor((i-1)/2), a1=heapPos(p,n,W), b1=heapPos(i,n,W);
      var e=document.createElement("div"); e.className="heap-edge";
      var dx=b1.x-a1.x, dy=b1.y-a1.y, len=Math.sqrt(dx*dx+dy*dy);
      e.style.left=a1.x+"px"; e.style.top=a1.y+"px"; e.style.width=len+"px"; e.style.transform="rotate("+Math.atan2(dy,dx)+"rad)";
      heap.appendChild(e);
    }
    for(var k=0;k<n;k++){
      var pos=heapPos(k,n,W), node=document.createElement("div"), cls=classesFor(s,k);
      node.className="heap-node "+cls.join(" ");
      if(s.range && k>s.range[1]) node.classList.add("dim");
      node.style.left=pos.x+"px"; node.style.top=pos.y+"px";
      node.innerHTML='<div class="num">'+safe(s.array[k])+'</div><div class="idx">'+k+'</div>';
      heap.appendChild(node);
    }
    viewEl.appendChild(heap);
  }
  function heapPos(i,n,W){
    var level=Math.floor(Math.log2(i+1));
    var first=Math.pow(2,level)-1;
    var index=i-first;
    var count=Math.pow(2,level);
    return {x:W*(index+1)/(count+1), y:42+level*82};
  }

  function renderBuckets(s){
    viewEl.className = "bars bucket-mode";
    viewEl.innerHTML = "";
    var wrap=document.createElement("div"); wrap.className="bucket-view";
    var src=document.createElement("div"); src.className="bucket-source";
    (s.output || s.array).forEach(function(v,k){
      var t=document.createElement("div"); t.className="token "+(k===s.pivotIndex?"focus":""); t.textContent=v; src.appendChild(t);
    });
    wrap.appendChild(src);
    if(s.counts){ addBuckets(wrap,s.counts.map(function(c,i){return Array(c).fill(i);}),s); }
    else { addBuckets(wrap,s.buckets || [],s); }
    viewEl.appendChild(wrap);
  }
  function addBuckets(wrap,buckets,s){
    var grid=document.createElement("div"); grid.className="buckets";
    buckets.forEach(function(bucket,i){
      var box=document.createElement("div"); box.className="bucket"+(s.focus.indexOf(i)>=0?" hot":"");
      box.innerHTML='<div class="bucket-label">bucket '+i+'</div><div class="bucket-items"></div>';
      var items=box.querySelector(".bucket-items");
      bucket.forEach(function(v){ var t=document.createElement("div"); t.className="token"; t.textContent=v; items.appendChild(t); });
      grid.appendChild(box);
    });
    wrap.appendChild(grid);
  }

  function renderStep(S){
    cur=S;
    var s=steps[S];
    if(s.mode==="array") renderArray(s);
    else if(s.mode==="heap") renderHeap(s);
    else if(s.mode==="buckets") renderBuckets(s);
    else renderBars(s);
    codeLines.forEach(function(ln){ ln.classList.toggle("active",(+ln.dataset.line)===s.line && s.line!==0); });
    document.getElementById("narration").innerHTML=s.desc;
    document.getElementById("st-cmp").textContent=s.comparisons;
    document.getElementById("st-write").textContent=s.writes;
    document.getElementById("st-pass").textContent=s.passes;
    document.getElementById("st-n").textContent=s.array.length;
    stackEl.innerHTML="";
    (config.traceLabels||[]).forEach(function(row){
      var div=document.createElement("div"); div.className="stat";
      div.innerHTML='<div class="k">'+safe(row.k)+'</div><div class="v"><small>'+safe(row.v)+'</small></div>';
      stackEl.appendChild(div);
    });
    document.getElementById("scrub").value=S;
    document.getElementById("steplabel").textContent="step "+(S+1)+" / "+steps.length;
    document.getElementById("back").disabled=S<=0;
    document.getElementById("fwd").disabled=S>=steps.length-1;
  }

  function inspectItem(index){
    stop();
    var s=steps[cur];
    if(!s || index<0 || index>=s.array.length) return;
    document.getElementById("narration").innerHTML="Index <b>"+index+"</b> currently holds <b>"+safe(s.array[index])+"</b>.";
  }
  function setPlayIcon(){
    playBtn.innerHTML=playing?'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg> Pause':'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Play';
    playBtn.setAttribute("aria-pressed",playing?"true":"false");
  }
  function tick(){
    if(!playing) return;
    if(cur>=steps.length-1){ stop(); return; }
    renderStep(cur+1);
    timer=setTimeout(tick,Math.max(80,1520-+document.getElementById("speed").value));
  }
  function play(){ if(cur>=steps.length-1) renderStep(0); playing=true; setPlayIcon(); tick(); }
  function stop(){ playing=false; setPlayIcon(); if(timer){ clearTimeout(timer); timer=null; } }
  function rebuild(newArr){
    stop(); arr=newArr; barCols=[]; buildSteps(arr);
    var scrub=document.getElementById("scrub"); scrub.max=steps.length-1; scrub.value=0; renderStep(0);
  }
  function applyCustom(){
    var input=document.getElementById("custom");
    var raw=input.value.trim();
    var tokens=raw ? raw.split(/[\s,]+/).filter(Boolean) : [];
    var invalid=tokens.filter(function(x){ return !/^-?\d+$/.test(x); });
    if(invalid.length){
      document.getElementById("narration").innerHTML="Please use whole numbers separated by commas or spaces.";
      return;
    }
    var parts=tokens.map(function(x){return parseInt(x,10);});
    var inputMax = config.inputMax || 120;
    parts=parts.slice(0,12).map(function(x){return Math.max(0,Math.min(inputMax,x));});
    if(parts.length<2){ document.getElementById("narration").innerHTML="Please enter at least two numbers, e.g. <b>5, 2, 9, 1</b>."; return; }
    input.value=parts.join(", ");
    rebuild(parts);
  }

  playBtn.addEventListener("click",function(){ playing?stop():play(); });
  document.getElementById("fwd").addEventListener("click",function(){ stop(); if(cur<steps.length-1) renderStep(cur+1); });
  document.getElementById("back").addEventListener("click",function(){ stop(); if(cur>0) renderStep(cur-1); });
  document.getElementById("reset").addEventListener("click",function(){ stop(); renderStep(0); });
  document.getElementById("scrub").addEventListener("input",function(e){ stop(); renderStep(+e.target.value); });
  document.getElementById("speed").addEventListener("input",function(){ if(playing){ if(timer) clearTimeout(timer); timer=setTimeout(tick,Math.max(80,1520-+document.getElementById("speed").value)); } });
  document.getElementById("rand").addEventListener("click",function(){
    var n=6+Math.floor(Math.random()*5), a=[];
    for(var k=0;k<n;k++) a.push(Math.floor(Math.random()*(config.maxRandom || 98)));
    document.getElementById("custom").value=""; rebuild(a);
  });
  document.getElementById("apply").addEventListener("click",applyCustom);
  document.getElementById("custom").addEventListener("keydown",function(e){ if(e.key==="Enter") applyCustom(); });
  document.addEventListener("keydown",function(e){
    if(["INPUT","SELECT","TEXTAREA"].indexOf(document.activeElement.tagName)>=0) return;
    if(e.key==="ArrowRight"){ stop(); if(cur<steps.length-1) renderStep(cur+1); e.preventDefault(); }
    else if(e.key==="ArrowLeft"){ stop(); if(cur>0) renderStep(cur-1); e.preventDefault(); }
    else if(e.key===" "){ playing?stop():play(); e.preventDefault(); }
  });

  rebuild(arr);
})();
