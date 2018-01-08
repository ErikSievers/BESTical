const   Promise         = require('bluebird'),
        express         = require('express'),
        ical            = require('ical-generator'),
        config          = require('config'),
        schedule        = require('node-schedule'),
        request         = require('request-promise');

let cal;

//init
makeCalendar(); 
schedule.scheduleJob('* * 4 * *', makeCalendar); //Update calendar at 4 in the morning

const app = express();

app.use( (req, res) => {
    cal.serve(res);
})

app.listen(process.env.PORT || 3000, '127.0.0.1', function() {
    console.log('Server running');
});

function getAllEvents(){
    let options = {
        method : 'GET',
        uri : 'https://private.best.eu.org/events/eventList.jsp',
        headers: {
            'Cookie': `username=${process.env.username || config.username}; password=${process.env.password || config.password}`
        }
    };
    return request(options);
}
function makeCalendar() {
    cal = ical({domain: '', name: "Erik's BEST ical"});
    getAllEvents().then(result => {
        let rows = result.match(/<tr[\d\D]*?<\/tr>/g);
        for(let row of rows){
            let name = row.match(/<a.*?>([\d\D]*?)<\/a/);
            let id = row.match(/event=(.*?)'/);
            if (id && name){
                name = name[1];
                id = id[1];
                console.log(id);
                let dateString = row.match(/<td>(.*?)<\/td/g)[3]; 
                let fromDate = new Date(dateString.match(/(\d.*?) - (\d.*?)</)[1]);
                let toDate = new Date(dateString.match(/(\d.*?) - (\d.*?)</)[2]);
                if(toDate > new Date()){
                    cal.createEvent({
                        start: fromDate,
                        end: toDate,
                        summary: name,
                        description: id,
                        location: 'unclear',
                        url: 'http://google.com/'
                    });
                }
            }
        }
    });
}