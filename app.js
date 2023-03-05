const process = require('process');
const args = require('minimist')(process.argv.slice(2));

const startDate = new Date(
	args.start.split("/").reverse().join('/')
);

const endDate = new Date(
	args.end.split("/").reverse().join('/')
);

console.log("start: ", startDate);
console.log("end: ", endDate);

(function () {

	const TWO_WEEKS = 14; // days

	function plusDays(date, days) {
		const result = new Date(date);
		result.setDate(result.getDate() + days);
		return result;
	}

	// to use correctly google calendar is raccomanded to 
	// write events in blocks of 2 weeks with a pause 
	function processRangeOfDates(start, end, counter) {
		const currStartDate = plusDays(start, counter * TWO_WEEKS);
		
		const tempEndDate = plusDays(currStartDate, TWO_WEEKS);
		const currEndDate = end < tempEndDate
			? end
			: tempEndDate;
		
		return [currStartDate, currEndDate, counter + 1];
	}

	// first range process
	let [currStartDate, currEndDate, counter] = processRangeOfDates(
		startDate, 
		endDate,
		0
	);

	while (currStartDate < currEndDate) {
		processRangeOnCalendar(currStartDate, currEndDate);

		// sliding of the range
		[currStartDate, currEndDate, counter] = processRangeOfDates(
			startDate, 
			endDate,
			counter
		);
	}

})()

function processRangeOnCalendar(currStartDate, currEndDate) {
	console.log(currStartDate, currEndDate);
}