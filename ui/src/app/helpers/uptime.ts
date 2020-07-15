/**
 * Helper class to calculuate current uptime
 */

export class Uptime {
  public calculate(time: any): string {
    //var seconds = Math.floor(()/1000)
    var d = Math.abs(+ new Date() - time) / 1000
    var r = {}
    var s = {
        'Year(s)': 31536000,
        'Month(s)': 2592000,
        'Week(s)': 604800,
        'Day(s)': 86400,
        'Hour(s)': 3600,
        'Minute(s)': 60,
        'Second(s)': 1
    }

    Object.keys(s).forEach(function(key){
        r[key] = Math.floor(d / s[key])
        d -= r[key] * s[key]
    })
    let uptime = ''
    for (let key in r) {
      if (r[key] !== 0 )
        uptime += `${r[key]} ${key} `
    }
    return uptime
  }
}
