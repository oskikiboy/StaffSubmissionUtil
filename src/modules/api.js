const index = require('./../index');
const utils = require('./../utils');
const webhook = require('./webhook');

const RateLimit = require("express-rate-limit");

exports.init = function (app) {

    app.use('/api/', new RateLimit({
        windowMs: 3600000,	// 150 requests/per hr
        max: 150,
        delayMs: 0
    }));

    app.get('/api/submit', (req, res) => {
        if (!req.isAuthenticated() || !index.config.moderationOpen) {
            res.status(401).send('Session not authenticated or you do not have permission to submit an application!');
            return;
        }

        try {

            let username = req.user.username;
            let userId = req.user.id;
            let position = req.query.position;
            let age = req.query.age;
            let timezone = req.query.timezone;
            let country = req.query.country;
            let experience = req.query.experience;
            let reason = req.query.reason;

            if (position && age && timezone && country && experience && reason) {

                utils.isUserBanned(req.user.id).then(isBanned => {
                    if (isBanned) return res.status(401).send(`Sorry but you have been banned from posting numbers! Contact server administration team if you feel this was a mistake!`);

                    utils.submitApplication(username, userId, position, age, timezone, country, experience, reason).then(() => {
                        webhook.newApplication(username, position);
                        res.status(200).send(`Successfully submitted application for ${req.user.username}`);

                    }).catch(err => {
                        console.error(`Unable to submit application, Error: ${err.stack}`);
                        res.status(400).send(`Unable to submit application, please try again later or contact the server administration team for help!!`);
                    })
                });
            } else {
                res.status(500).send("Sorry but you have not submit all the required fields!")
            }

        } catch (err) {
            console.error(`Unable to submit application, Error: ${err.stack}`);
            res.status(500).send('Unable to submit application, please try again later or contact server administration team!');
        }
    });

};