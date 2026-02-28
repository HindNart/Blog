const express = require('express');
const handlebars = require('express-handlebars');
const morgan = require('morgan');
const path = require('path');

const app = express();


// Parse request body
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// HTTP request logger
app.use(morgan('combined'))

// Method override
// app.use(methodOverride('_method'))

// Custom middleware
// app.use(SortMiddleware)

// Template engine
app.engine('.hbs', handlebars.engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('home');
});

module.exports = app;