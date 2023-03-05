const process = require('process');
const args = require('minimist')(process.argv.slice(2));

require('dotenv').config();

const axios = require('axios');

// Parsing arguments 
const [startDate, endDate, course, year] = (function parseArgs() {
  const startDate = new Date(
    args.start.split("/").reverse().join('/')
  );
  
  const endDate = new Date(
    args.end.split("/").reverse().join('/')
  );

  const course = args.course;
  const year = args.year;
  
  const INVALID_DATE = "Invalid Date";
  
  if (startDate.toString() === INVALID_DATE || 
      endDate.toString() === INVALID_DATE ||
      !course || !year)
  {
    console.log("usage: node app --start=[valid-date] --end=[valid-date] --course=[course] --year=[year]");
    process.exit(-1)
  }

  return [startDate, endDate, course, year];
})();

console.log('args: ', startDate.getDate(), endDate.getDate(), course, year);

// Init Google Calendar
const calendar = (function createCalendar() {
  // TODO: to remove
  return null;

  const { google } = require('googleapis');
  const { OAuth2 } = google.auth;

  const oAuth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
  );
  
  oAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
  });
  
  return google.calendar({ version: 'v3', auth: oAuth2Client });
})();

(function () {

  const TWO_WEEKS = 14; // days
  const TWO_WEEKS_STEP = 13; // days
  const STEP_IN_MILLIS = 4000;

  function plusDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // to use correctly google calendar is raccomanded to 
  // write events in blocks of 2 weeks with a pause 
  function processRangeOfDates(start, end, counter) {
    const currStartDate = plusDays(start, counter * TWO_WEEKS);
    
    const tempEndDate = plusDays(currStartDate, TWO_WEEKS_STEP);
    const currEndDate = end < tempEndDate
      ? end
      : tempEndDate;
    
    return [currStartDate, currEndDate, counter + 1];
  }

  const PARTIAL_UNIBO_API_URL_FOR_LESSONS = (function composePartialUniboApiUrlForLessons() {
    const FIRST_PART_OF_UNIBO_URL = 'https://corsi.unibo.it/laurea';
    const THIRD_PART_OF_UNIBO_URL = `orario-lezioni/@@orario_reale_json?anno=${year}&curricula=`; 
    return `${FIRST_PART_OF_UNIBO_URL}/${course}/${THIRD_PART_OF_UNIBO_URL}`;
  })();

  let cnt = 0;

  while (true) {

    const [currStartDate, currEndDate, counter] = processRangeOfDates(
      startDate, 
      endDate,
      cnt
    );

    cnt = counter;

    if (currStartDate >= currEndDate) {
      break;
    }

    setTimeout(
      () => processRangeOnCalendar(currStartDate, currEndDate, PARTIAL_UNIBO_API_URL_FOR_LESSONS), 
      STEP_IN_MILLIS * counter
    );

  }

})()

function processRangeOnCalendar(currStartDate, currEndDate, partialUniboApiUrlForLessons) {
  const uniboApiUrl = (function composeApiUrl() {
    return `${partialUniboApiUrlForLessons}&start=${format(currStartDate)}&end=${format(currEndDate)}`
  })();

  console.log("fetching: ", uniboApiUrl);

  axios.get(uniboApiUrl)
    .then(function (response) {
      const { data } = response;
      data.forEach(dataRow => {
        const [summary, location, description, start, end] = buildEventFromGivenData(dataRow);
        console.log("processing data...");
        
        // TODO:
        // createEvent(summary, location, description, start, end);
      
      });
    })
    .catch(function (error) {
      // TODO: handle error
      console.log(error);
    })
    .then(function () {
      // always executed
    });
}

function buildEventFromGivenData(dataRow) {
  const text = [];
  text.push(dataRow.time);
  text.push("\n");

  const summaryBuilder = [];
  summaryBuilder.push(dataRow.cod_modulo);
  summaryBuilder.push(" - ");
  summaryBuilder.push(dataRow.title);
  summaryBuilder.push(" (");
  summaryBuilder.push(dataRow.cfu);
  summaryBuilder.push(" CFU)");
  const summary = summaryBuilder.join(""); 
  
  text.push(summary);
  text.push("\n");
  text.push("Periodo: ");
  text.push(dataRow.periodo);
  text.push("\n");
  
  if (dataRow.docente) {
    text.push("Docente: ");
    text.push(dataRow.docente);
    text.push("\n");
  }
  
  let location;
  if (dataRow.aule.length > 0) {
    text.push("Luogo: ");
    text.push(dataRow.aule[0].des_edificio);
    text.push(" - ");
    text.push(dataRow.aule[0].des_piano);
    text.push(" - ");
    text.push(dataRow.aule[0].des_ubicazione);
    text.push("\n");
    location = dataRow.aule[0].des_indirizzo;
  } else {
    location = "Online";
  }

  if (dataRow.teams) {
    text.push("Teams: ");
    text.push(dataRow.teams);
    text.push("\n");
  }
  
  const description = text.join("");
  const start = new Date(dataRow.start);
  const end = new Date(dataRow.end);

  return [summary, location, description, start, end];
}

function createEvent(summary, location, description, start, end) {
  const event = {
    summary: summary,
    location: location,
    description: description,
    colorId: 7,
    start: {
      dateTime: start,
      timeZone: 'Europe/Rome',
    },
    end: {
      dateTime: end,
      timeZone: 'Europe/Rome',
    },
  }

  return calendar.events.insert(
    { calendarId: 'primary', resource: event },
    err => {
      if (err) return console.error('Error Creating Calender Event: ', err)
      return console.log('Calendar event successfully created: ' + summary)
    }
  );
}

function format(date) {
  let day, month, year;

  day = date.getDate();
  month = date.getMonth() + 1;
  year = date.getFullYear();

  day = day
    .toString()
    .padStart(2, '0');

  month = month
    .toString()
    .padStart(2, '0');

  return `${year}-${month}-${day}`;
}