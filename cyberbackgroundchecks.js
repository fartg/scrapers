/*
    Filename: cyberbackgroundchecks.js
    Author: zach
    Startdate: 24/7/23
    Notes: email only -__-
*/
(function(console) {
    console.save = function(data, filename) {
        if (!data) {
            console.error('Console.save: No data')
            return;
        }
        if (!filename) filename = 'console.json'
        if (typeof data === "object") {
            data = JSON.stringify(data, undefined, 4)
        }
        var blob = new Blob([data], {
                type: 'text/json'
            }),
            e = document.createEvent('MouseEvents'),
            a = document.createElement('a')
        a.download = filename
        a.href = window.URL.createObjectURL(blob)
        a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        a.dispatchEvent(e)
    }
})(console)

var requests = {
    email: async function (email) {
        try {
            let response = await fetch(`https://www.cyberbackgroundchecks.com/email/${email}`, {
                "credentials": "include",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Upgrade-Insecure-Requests": "1",
                    "Sec-Fetch-Dest": "document",
                    "Sec-Fetch-Mode": "navigate",
                    "Sec-Fetch-Site": "none",
                    "Sec-Fetch-User": "?1"
                },
                "method": "GET",
                "mode": "cors"
            });

            if(response.status === 404) return [false, "user_not_found"];
            if(response.status === 500) return [false, "cloudflare_error"];
            if(response.status != 200) return [false, `${response.status} error`];

            if (response.ok) {
                let data = await response.text();
                const parser = new DOMParser();
                return [true, parser.parseFromString(data, "text/html")];
            }
        }
        catch ( e ) {
            console.log(e);
        }
    },
    user: async function(user_link) {
        try {
            let response = await fetch(`${user_link}`, {
                "credentials": "include",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Upgrade-Insecure-Requests": "1",
                    "Sec-Fetch-Dest": "document",
                    "Sec-Fetch-Mode": "navigate",
                    "Sec-Fetch-Site": "none",
                    "Sec-Fetch-User": "?1"
                },
                "method": "GET",
                "mode": "cors"
            });

            if(response.status === 404) return false;
            if(response.status === 500) return "500";
            if(response.status != 200) return false;

            if (response.ok) {
                let data = await response.text();
                const parser = new DOMParser();
                const htmlDocument = parser.parseFromString(data, "text/html");
                let scripts = htmlDocument.getElementsByTagName("script");
                return scripts;
            }
        }
        catch ( e ) {
            console.log(e);
        } 
    }
}

var generation = {
    data: function ( emails, name, addresses, phones ) {
        return {
            "emails": emails,
            "name": name,
            "addresses": addresses,
            "phones": phones
        }
    }
}


var sanitize = {
    addresses: function(addresses) {
        let storage = [];
        
        // Check that addresses exists and isn't of length 0
        if (!addresses) return storage;
        if (!addresses.length) return storage;

        // Check that the addresses list is an array
        if (typeof addresses === "string") {
            storage.push(`${addresses}`);
            console.log("Only a string!");
            return storage;
        }

        // Push the addresses to our storage variable
        for (iterate in addresses) 
            storage.push(`${addresses[iterate].streetAddress} ${addresses[iterate].addressLocality}, ${addresses[iterate].addressRegion}, ${addresses[iterate].postalCode}, ${addresses[iterate].addressCountry}`);
        
        return storage;
    },
    emails: function(emails) {
        let storage = [];

        // Check that emails exists and isn't of length 0
        if (!emails) return storage;
        if (emails.length === null) return storage;

        // Check that the emails list is an array
        if (typeof emails === "string") {
            storage.push(`${emails}`);
            console.log("Only a string!");
            return storage;
        }

        // Push the emails to our storage variable
        for (var i = 0; i < emails.length; i++) 
            storage.push(emails[i]);
        
        return storage
    },
    phones: function(phones) {
        let storage = [];

        // Check that phones exists and isn't of length 0
        if (!phones) return storage;
        if (phones.length === null) return storage;

        // Check that the phones list is an array
        if (typeof phones === "string") {
            storage.push(`${phones.replaceAll("(", "").replaceAll(")", "").replaceAll(" ", "").replaceAll("-", "")}`);
            console.log("Only a string!");
            return storage;
        }

        // Push the phones to our storage variable
        for (var i = 0; i < phones.length; i++) 
            storage.push(phones[i].replaceAll("(", "").replaceAll(")", "").replaceAll(" ", "").replaceAll("-", ""))
        
        return storage
    }
}

var storage = {
    first_user: "body > div:nth-child(8) > div:nth-child(9) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > div:nth-child(1) > a"
}

//Grab the script index of the JSON information
function grabScriptIndex(document) {
    for (var i = 0; i < document.length; i++) {
        try {
            if (JSON.parse(document[i].text)[0].hasOwnProperty("email"))  // Only our specific script will have the "email" property...
                return i
        } catch (e) {
            continue
        }
    }
}

function replace_email(email) {
    return email.replaceAll("@", "_.");
}

async function Initiate(options) {
    var output = [];

    for (const iterate in options.data) {
        console.log(`${iterate} out of ${options.data.length} (${((iterate/options.data.length)*100).toFixed(3)}% complete)`);
        var email_request = await requests.email(replace_email(options.data[iterate]));

        if(!email_request[0]) { // no user linked
            console.log(`[E] ${email_request[1]}`);
            continue
        }

        // Fetch and sanitize data of user that we found,
        var user_request = await requests.user(email_request[1].querySelector(storage.first_user).href);
        var data_index = grabScriptIndex(user_request);
        var data_found = JSON.parse(user_request[data_index].innerText)[0];
        var generated_data = generation.data(sanitize.emails(data_found.email),
                                             data_found.name,
                                             sanitize.addresses(data_found.address),
                                             sanitize.phones(data_found.telephone));
        
        console.log(generated_data);
        output.push(generated_data);
    }
    console.save(output, `${options.data.length}-cbc-e-auto.json`);
}

var input = [];

Initiate({
    data: input
})