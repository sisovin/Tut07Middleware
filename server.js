// import the http module
//const http = require('http');
const express = require('express');
const app = express();
const path = require('path');
// Before using the custom middleware logger, we need to import it
// must install the cors package, type: npm i cors
const cors = require('cors');
// Before using the custom middleware logger, we need to import it
const { logger, logEvents } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
// Define the port to listen on
const PORT = process.env.PORT || 3500;
// In order to use the helmet middleware, 
// we need to install it, type: npm i helmet
const helmet = require('helmet');
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
//This sets the 'connect-src' policy to allow connections to the same origin('self') and 'http://localhost:3500'.
// Add 'http://localhost:3500' to the connect-src directive in the Content-Security-Policy header
app.use((req, res, next) => {
    if (!res.getHeader("Content-Security-Policy")) {
        res.setHeader("Content-Security-Policy", "connect-src 'self' http://localhost:3500");
        next();
    }
    else {
        next();
    }
});

// custom middleware logger
//app.use((req, res, next) => {
//    // log the request
//    logEvents(`[${new Date().toLocaleString()}]\t${req.method}\t${req.headers.origin}\t${req.url}`, `reglog.txt`);
//    console.log(`${req.method} ${req.path}`);
//    next();
//});
// I have blocked the above code because I have moved
// to implement the logger to a separate file called logEvents.js

app.use(logger);

// cors middleware for cross-origin resource sharing
const whitelist = ['https://www.yoursite.com', 'http://127.0.0.1:5500', 'http://localhost:3500'];
const corsOptions = {
    origin: (origin, callback) => {
        console.log(`Origin: ${origin}`);
        logEvents(`Origin: ${origin}`, `originlog.txt`); // log the origin
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error(`Not allowed by CORS`));
        }
    },
    optionsSuccessStatus: 200
}
console.log(corsOptions);
logEvents(`Whitelist: ${whitelist}`, `whitelistlog.txt`); // log the whitelist
logEvents(`CORS Options: ${JSON.stringify(corsOptions)}`, `corsOptionslog.txt`); // log the corsOptions
app.use(cors(corsOptions));

// built-in middleware to handle url-encoded data
// in other words, form data:
// `content-type: application/x-www-form-urlencoded`
app.use(express.urlencoded({ extended: false }));

// if you put app.use(express.json()) here, it will not work,
// then we need to put it in the route handler as shown below:
// built-in middleware for json data
app.use(express.json());

// server static files
app.use(express.static(path.join(__dirname, `/public`)));

app.get('^/$|/index(.html)?', (req, res) => {
    /*res.sendFile(`./views/index.html`, { root: __dirname });*/
    res.sendFile(path.join(__dirname, `views`, `index.html`));
});

app.get(`/new-page(.html)?`, (req, res) => {
    res.sendFile(path.join(__dirname, `views`, `new-page.html`));
});

app.get(`/old-page(.html)?`, (req, res) => {
    res.redirect(301, `/new-page.html`);
});

// Talking about the route handlers
app.get(`/hello(.hyml)?`, (req, res, next) => {
    console.log(`attempted to load hello.html`);
    next()
}, (req, res) => {
    res.send(`hello world!`);
});


// changing the route handlers to a function
const one = (req, res, next) => {
    console.log(`one`);
    next();
}

const two = (req, res, next) => {
    console.log(`two`);
    next();
}

const three = (req, res) => {
    console.log(`three`);
    res.send(`Finished!`);
}

app.get(`/change(.html)?`, [one, two, three]);

app.all(`*`, (req, res) => {
    res.status(404);
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, `views`, `404.html`));
    } else if (req.accepts('json')) {
        res.json({ error: `404 Not Found` });    
    }
    else {
        res.type('txt').send(`404 Not Found`);
    }

});

//app.get(`/*`, (req, res) => {
//    res.status(404).sendFile(path.join(__dirname, `views`, `404.html`));
//});

//app.use(function (err, req, res, next) {
//    console.error(err.stack);
//    res.status(500).send(err.message);

//})
app.use(errorHandler);

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
