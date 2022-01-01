function form(e) {
  e.preventDefault();
  document.getElementById("shorten-btn").disabled = true; document.getElementById("shorten-btn").classList.add("loading");
  var f = e.target;
  var action = f.getAttribute("action"),
    method = f.getAttribute("method"),
    contentType = f.getAttribute("enctype"),
    fields = f.dataset.fields.split(","),
    fieldsData = {};
  for (item in fields) {
    if (f[fields[item]].getAttribute("type") == "checkbox") {
      fieldsData[fields[item].toLowerCase()] = f[fields[item]].value == "on" ? true : false;
      continue;
    }
    fieldsData[fields[item].toLowerCase()] = f[fields[item]].value;
  }
  fetch(action, {
    "method": method,
    "headers": {
      'Content-Type': contentType
    },
    "body": JSON.stringify(fieldsData)
  })
    .then(r => r.json())
    .catch(err => {
      // console.log(err);
      document.getElementById("shorten-btn").disabled = false; document.getElementById("shorten-btn").classList.remove("loading");
      document.getElementById("output-section").hidden = true;
    })
    .then(res => {
      var d = res;
      // console.log(JSON.stringify(d, null, 2))
      if (d.code == 200) {
        console.log("URL Shortend Successfully!");
        var cont = document.getElementById("usefull-link-container");
        cont.dataset.clipboardText = d.link;
        document.getElementById("usefull-link").textContent = d.link;
        document.getElementById("usefull-link").setAttribute("title", d.link);
        document.getElementById("output-section").hidden = false;
        window.location.href.hash = document.getElementById("link-box").value;
      }
      if (d.code == 400 || d.error) {
        console.log("An Error Occurred!");
        var cont = document.getElementById("usefull-link-container");
        cont.dataset.clipboardText = "";
        document.getElementById("usefull-link").textContent = "";
        document.getElementById("usefull-link").setAttribute("title", ""); document.getElementById("output-section").hidden = true;
        window.location.href.hash = document.getElementById("link-box").value;
      }
      document.getElementById("shorten-btn").disabled = false; document.getElementById("shorten-btn").classList.remove("loading");
    })
    .catch(err => {
      console.log(err);
      document.getElementById("shorten-btn").disabled = false; document.getElementById("shorten-btn").classList.remove("loading");
      document.getElementById("output-section").hidden = true;
    })
}