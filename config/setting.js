/**
 * author: Martin
 */

var config = {
		local: {
			mode: 'local',
			port: 8003,
			mongo: {        //connect to local mongo DB
				host: 'localhost',
				port: 27017,
				user: '',
				pass: '',
				db_name: 'swipex_local'
			},
		},
		production: {
			mode: 'production',
			port: 80,
			mongo: {
				host: '127.0.0.1',
				port: 27017
			},
		}
}
module.exports = function(mode) {
	return config[mode || process.argv[2] || 'local'] || config.local;
}
