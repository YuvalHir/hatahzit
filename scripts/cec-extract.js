// CEC national-results extractor — runs INSIDE the cloud browser on
// https://votes26.bechirot.gov.il/nationalresults?lang=he (the page is behind
// anti-bot; plain fetch/curl gets HTTP 202 with an empty body, so extraction
// goes through the monitored browser lease). Returns JSON via execute-js.
(function(){
  var t = document.body.innerText;
  var m = t.match(/תוצאות נכון ל-\s*([\d\/]+\s+[\d:]+)/);
  function num(re){var x=t.match(re);return x?parseInt(x[1].replace(/,/g,''),10):null;}
  var rows=[];
  document.querySelectorAll('tr').forEach(function(tr){
    var c=tr.querySelectorAll('td,th');
    if(c.length>=4){
      var name=c[0].innerText.trim(), letters=c[1].innerText.trim(),
          pct=c[2].innerText.trim(), votes=c[3].innerText.trim().replace(/,/g,'');
      if(letters && /%/.test(pct) && /^\d+$/.test(votes)) rows.push({name:name,letters:letters,pct:pct,votes:parseInt(votes,10)});
    }
  });
  return JSON.stringify({as_of:m?m[1]:null, eligible:num(/מספר בעלי זכות בחירה\s*([\d,]+)/),
    votes_so_far:num(/קולות עד עתה\s*([\d,]+)/), ballots:num(/קלפיות עד עתה\s*([\d,]+)/),
    valid:num(/קולות כשרים עד עתה\s*([\d,]+)/), invalid:num(/קולות פסולים עד עתה\s*([\d,]+)/),
    nrows:rows.length, rows:rows});
})()
