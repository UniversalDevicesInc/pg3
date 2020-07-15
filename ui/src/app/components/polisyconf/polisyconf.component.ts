import { Component, OnInit, OnDestroy } from '@angular/core'
import { SettingsService } from '../../services/settings.service'
import { WebsocketsService } from '../../services/websockets.service'
import { AuthService } from '../../services/auth.service'
import { Router } from '@angular/router'
import { FlashMessagesService } from 'angular2-flash-messages'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { ConfirmComponent } from '../confirm/confirm.component'
import { Subscription } from 'rxjs'

@Component({
   selector: 'app-polisyconf',
   templateUrl: './polisyconf.component.html',
   styleUrls: ['./polisyconf.component.css']
})

export class PolisyconfComponent implements OnInit, OnDestroy  {

   private subscription: Subscription = new Subscription()
   public mqttConnected: boolean = false
   private subConnected: any
   public settingsForm: FormGroup
   public objectValues = Object.values
   public objectKeys = Object.keys

   private subPolisyNics: any
   private subPolisyNic: any
   private subPolisyWifi: any
   private subPolisyDatetime: any
   private subPolisyDatetimeAll: any

   public polisyNics: any
   public polisyWifi: any
   public polisyDatetimes: []
   public currentDatetime: Object
   public selectedDatetime: any
   public selectedNic: any
   public selectedWifi: any
   public nicForm: FormGroup
   public dhcpChecked: boolean
   public rtadvChecked: boolean
   public ipv6Enabled: boolean
   public nicEnabled: boolean
   public gotWifi: boolean = false
   public allowIpv6: boolean = false
   public wifiKey: String
   nicSubmitted = false

   private dateTimeAllTest = [
      {
         "name": "USA, AK, Anchorage",
         "latitude": "61.217",
         "longitude": "149.90",
         "tzOffset": "-9",
         "dstRule": "NAM",
         "tzid": "America/Anchorage"
      },
      {
         "name": "USA, AK, Atqasuk",
         "latitude": "70.47215",
         "longitude": "157.4078",
         "tzOffset": "-9",
         "dstRule": "NAM",
         "tzid": "America/Juneau"
      },
      {
         "name": "USA, AK, Barrow",
         "latitude": "71.30",
         "longitude": "156.683",
         "tzOffset": "-9",
         "dstRule": "NAM",
         "tzid": "America/Juneau"
      },
      {
         "name": "USA, AL, Birmingham",
         "latitude": "33.521",
         "longitude": "86.8025",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, AZ, Phoenix",
         "latitude": "33.433",
         "longitude": "112.067",
         "tzOffset": "-7",
         "dstRule": "OFF",
         "tzid": "America/Phoenix"
      },
      {
         "name": "USA, CA, Hanford",
         "latitude": "36.31",
         "longitude": "119.63",
         "tzOffset": "-8",
         "dstRule": "NAM",
         "tzid": "America/Los_Angeles"
      },
      {
         "name": "USA, CA, Los Angeles",
         "latitude": "34.05",
         "longitude": "118.233",
         "tzOffset": "-8",
         "dstRule": "NAM",
         "tzid": "America/Los_Angeles",
         "isDefault": true
      },
      {
         "name": "USA, CA, San Diego",
         "latitude": "32.7667",
         "longitude": "117.2167",
         "tzOffset": "-8",
         "dstRule": "NAM",
         "tzid": "America/Los_Angeles"
      },
      {
         "name": "USA, CA, San Francisco",
         "latitude": "37.7667",
         "longitude": "122.4167",
         "tzOffset": "-8",
         "dstRule": "NAM",
         "tzid": "America/Los_Angeles"
      },
      {
         "name": "USA, CO, Boulder",
         "latitude": "40.125",
         "longitude": "105.237",
         "tzOffset": "-7",
         "dstRule": "NAM",
         "tzid": "America/Denver"
      },
      {
         "name": "USA, CO, Denver",
         "latitude": "39.733",
         "longitude": "104.983",
         "tzOffset": "-7",
         "dstRule": "NAM",
         "tzid": "America/Denver"
      },
      {
         "name": "USA, CO, Table Mountain",
         "latitude": "40.125",
         "longitude": "105.23694",
         "tzOffset": "-7",
         "dstRule": "NAM",
         "tzid": "America/Denver"
      },
      {
         "name": "USA, DC, Washington",
         "latitude": "38.8833",
         "longitude": "77.0333",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/New_York"
      },
      {
         "name": "USA, FL, Miami",
         "latitude": "25.767",
         "longitude": "80.183",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/New_York"
      },
      {
         "name": "USA, FL, Tallahassee",
         "latitude": "30.38",
         "longitude": "84.37",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/New_York"
      },
      {
         "name": "USA, GA, Atlanta",
         "latitude": "33.733",
         "longitude": "84.383",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/New_York"
      },
      {
         "name": "USA, HI, Honolulu",
         "latitude": "21.30",
         "longitude": "157.85",
         "tzOffset": "-10",
         "dstRule": "OFF",
         "tzid": "Pacific/Honolulu"
      },
      {
         "name": "USA, IL, Bondville",
         "latitude": "40.055277",
         "longitude": "88.371944",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, IL, Chicago",
         "latitude": "41.85",
         "longitude": "87.65",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, LA, New Orleans",
         "latitude": "29.95",
         "longitude": "90.067",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, IN, Indianapolis",
         "latitude": "39.767",
         "longitude": "86.15",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/New_York"
      },
      {
         "name": "USA, MA, Boston",
         "latitude": "42.35",
         "longitude": "71.05",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/New_York"
      },
      {
         "name": "USA, ME, Portland",
         "latitude": "43.666",
         "longitude": "70.283",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/New_York"
      },
      {
         "name": "USA, MI, Detroit",
         "latitude": "42.333",
         "longitude": "83.05",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/Detroit"
      },
      {
         "name": "USA, MN, Minneapolis",
         "latitude": "44.967",
         "longitude": "93.25",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, MO, Kansas City",
         "latitude": "39.083",
         "longitude": "94.567",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, MO, Saint Louis",
         "latitude": "38.6167",
         "longitude": "90.1833",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, MS, Goodwin Creek",
         "latitude": "34.2544444",
         "longitude": "89.8738888",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, MS, Jackson",
         "latitude": "32.283",
         "longitude": "90.183",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, MT, Fort Peck",
         "latitude": "48.310555",
         "longitude": "105.1025",
         "tzOffset": "-7",
         "dstRule": "NAM",
         "tzid": "America/Phoenix"
      },
      {
         "name": "USA, NC, Raleigh",
         "latitude": "35.783",
         "longitude": "78.65",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/New_York"
      },
      {
         "name": "USA, ND, Bismarck",
         "latitude": "46.817",
         "longitude": "100.783",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, NV, Desert Rock",
         "latitude": "36.626",
         "longitude": "116.018",
         "tzOffset": "-8",
         "dstRule": "NAM",
         "tzid": "America/Los_Angeles"
      },
      {
         "name": "USA, NV, Las Vegas",
         "latitude": "36.1215",
         "longitude": "115.1739",
         "tzOffset": "-8",
         "dstRule": "NAM",
         "tzid": "America/Los_Angeles"
      },
      {
         "name": "USA, NV, Reno",
         "latitude": "39.5272",
         "longitude": "119.8219",
         "tzOffset": "-8",
         "dstRule": "NAM",
         "tzid": "America/Los_Angeles"
      },
      {
         "name": "USA, NM, Albuquerque",
         "latitude": "35.0833",
         "longitude": "106.65",
         "tzOffset": "-7",
         "dstRule": "NAM",
         "tzid": "America/Phoenix"
      },
      {
         "name": "USA, NY, New York City",
         "latitude": "40.7167",
         "longitude": "74.0167",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/New_York"
      },
      {
         "name": "USA, OK, Oklahoma City",
         "latitude": "35.483",
         "longitude": "97.533",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, OR, Portland",
         "latitude": "45.517",
         "longitude": "122.65",
         "tzOffset": "-8",
         "dstRule": "NAM",
         "tzid": "America/Los_Angeles"
      },
      {
         "name": "USA, PA, Penn State",
         "latitude": "40.72",
         "longitude": "77.93",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/New_York"
      },
      {
         "name": "USA, PA, Philadelphia",
         "latitude": "39.95",
         "longitude": "75.15",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/New_York"
      },
      {
         "name": "USA, PA, Pittsburgh",
         "latitude": "40.433",
         "longitude": "79.9833",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/New_York"
      },
      {
         "name": "USA, SD, Sioux Falls",
         "latitude": "43.733",
         "longitude": "96.6233",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, TN, Oak Ridge",
         "latitude": "35.96",
         "longitude": "84.37",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/New_York"
      },
      {
         "name": "USA, TX, Austin",
         "latitude": "30.283",
         "longitude": "97.733",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, TX, Dallas",
         "latitude": "32.46",
         "longitude": "96.47",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, TX, Houston",
         "latitude": "29.75",
         "longitude": "95.35",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, TX, San Antonio",
         "latitude": "29.4167",
         "longitude": "98.5000",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, UT, Salt Lake City",
         "latitude": "40.77",
         "longitude": "111.97",
         "tzOffset": "-7",
         "dstRule": "NAM",
         "tzid": "America/Phoenix"
      },
      {
         "name": "USA, VA, Richmond",
         "latitude": "37.5667",
         "longitude": "77.450",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/New_York"
      },
      {
         "name": "USA, VA, Sterling",
         "latitude": "38.98",
         "longitude": "77.47",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/New_York"
      },
      {
         "name": "USA, WA, Seattle",
         "latitude": "47.68",
         "longitude": "122.25",
         "tzOffset": "-8",
         "dstRule": "NAM",
         "tzid": "America/Los_Angeles"
      },
      {
         "name": "USA, WI, Madison",
         "latitude": "43.13",
         "longitude": "89.33",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, WI, Menomonee Falls",
         "latitude": "43.11",
         "longitude": "88.10",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "USA, WN, Canaan Valley",
         "latitude": "39.1",
         "longitude": "79.4",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/New_York"
      },
      {
         "name": "USA, Nauru Island",
         "latitude": "-0.52",
         "longitude": "-166.92",
         "tzOffset": "12",
         "dstRule": "NAM",
         "tzid": "Pacific/Nauru"
      },
      {
         "name": "USA, SGP Central Facility",
         "latitude": "36.6167",
         "longitude": "97.5",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Chicago"
      },
      {
         "name": "Austria, Vienna",
         "latitude": "48.2000",
         "longitude": "-16.3667",
         "tzOffset": "1",
         "dstRule": "EU",
         "tzid": "Europe/Vienna"
      },
      {
         "name": "Australia, ACT, Canberra",
         "latitude": "-35.3075",
         "longitude": "-149.1244",
         "tzOffset": "10",
         "dstRule": "AUS",
         "tzid": "Australia/Sydney"
      },
      {
         "name": "Australia, NSW, Sydney",
         "latitude": "-33.8667",
         "longitude": "-151.2167",
         "tzOffset": "10",
         "dstRule": "AUS",
         "tzid": "Australia/Sydney"
      },
      {
         "name": "Australia, NSW, Lord How Island",
         "latitude": "-31.5500",
         "longitude": "-159.0833",
         "tzOffset": "10.50",
         "dstRule": "AUSLH",
         "tzid": "Australia/Lord_Howe"
      },
      {
         "name": "Australia, NT,  Darwin",
         "latitude": "-12.425",
         "longitude": "-130.891",
         "tzOffset": "9.50",
         "dstRule": "AUS",
         "tzid": "Australia/Adelaide"
      },
      {
         "name": "Australia, QLD, Brisbane",
         "latitude": "-27.4667",
         "longitude": "-153.0333",
         "tzOffset": "10",
         "dstRule": "AUS",
         "tzid": "Australia/Sydney"
      },
      {
         "name": "Australia, SA,  Adelaide",
         "latitude": "-34.9290",
         "longitude": "-138.6010",
         "tzOffset": "10.50",
         "dstRule": "AUS",
         "tzid": "Australia/Lord_Howe"
      },
      {
         "name": "Australia, TAS, Hobart",
         "latitude": "-42.8806",
         "longitude": "-147.3250",
         "tzOffset": "11",
         "dstRule": "AUS",
         "tzid": "Australia/Hobart"
      },
      {
         "name": "Australia, VIC, Melbourne",
         "latitude": "-37.8136",
         "longitude": "-144.9631",
         "tzOffset": "10",
         "dstRule": "AUS",
         "tzid": "Australia/Sydney"
      },
      {
         "name": "Australia, VA,  Perth",
         "latitude": "-31.9522",
         "longitude": "-115.8589",
         "tzOffset": "8",
         "dstRule": "AUS",
         "tzid": "Australia/Perth"
      },
      {
         "name": "Argentina, BA,  Buenos Aires",
         "latitude": "-34.60",
         "longitude": "58.45",
         "tzOffset": "-3",
         "dstRule": "OFF",
         "tzid": "America/Buenos_Aires"
      },
      {
         "name": "Argentina, CD,  Córdoba",
         "latitude": "-37.8833",
         "longitude": "4.7667",
         "tzOffset": "-3",
         "dstRule": "OFF",
         "tzid": "America/Buenos_Aires"
      },
      {
         "name": "Argentina, MD,  Mendoza",
         "latitude": "-32.8833",
         "longitude": "68.8167",
         "tzOffset": "-3",
         "dstRule": "OFF",
         "tzid": "America/Buenos_Aires"
      },
      {
         "name": "Argentina, SF,  Santa Fe",
         "latitude": "-33.7227",
         "longitude": "62.2460",
         "tzOffset": "-3",
         "dstRule": "OFF",
         "tzid": "America/Buenos_Aires"
      },
      {
         "name": "Azerbaijan, Baku",
         "latitude": "40.3000",
         "longitude": "-47.7000",
         "tzOffset": "4",
         "dstRule": "AZB",
         "tzid": "Asia/Baku"
      },
      {
         "name": "Bahamas, New Providence, Nassau",
         "latitude": "25.0600",
         "longitude": "77.3450",
         "tzOffset": "-4",
         "dstRule": "NAM",
         "tzid": "America/Nassau"
      },
      {
         "name": "Belgium, Brussels",
         "latitude": "50.8500",
         "longitude": "-4.3500",
         "tzOffset": "1",
         "dstRule": "EU",
         "tzid": "Europe/Brussels"
      },
      {
         "name": "Bermuda, Hamilton",
         "latitude": "32.2930",
         "longitude": "64.7820",
         "tzOffset": "-3",
         "dstRule": "NAM",
         "tzid": "Atlantic/Bermuda"
      },
      {
         "name": "Brazil, AL, Maceió",
         "latitude": "-9.6658",
         "longitude": "35.7350",
         "tzOffset": "-3",
         "dstRule": "OFF",
         "tzid": "America/Sao_Paulo"
      },
      {
         "name": "Brazil, AM, Manaus",
         "latitude": "-3.1000",
         "longitude": "60.0167",
         "tzOffset": "-4",
         "dstRule": "OFF",
         "tzid": "America/Manaus"
      },
      {
         "name": "Brazil, PA, Belém",
         "latitude": "-1.4558",
         "longitude": "48.5039",
         "tzOffset": "-3",
         "dstRule": "OFF",
         "tzid": "America/Sao_Paulo"
      },
      {
         "name": "Brazil, RJ, Rio de Janeiro",
         "latitude": "-22.9068",
         "longitude": "43.1729",
         "tzOffset": "-3",
         "dstRule": "OFF",
         "tzid": "America/Sao_Paulo"
      },
      {
         "name": "Brazil, SP, São Paulo",
         "latitude": "-23.5500",
         "longitude": "46.6333",
         "tzOffset": "-3",
         "dstRule": "OFF",
         "tzid": "America/Sao_Paulo"
      },
      {
         "name": "Canada, AB, Calgary",
         "latitude": "51.00",
         "longitude": "114.10",
         "tzOffset": "-7",
         "dstRule": "NAM",
         "tzid": "America/Edmonton"
      },
      {
         "name": "Canada, AB, Edmonton",
         "latitude": "53.30",
         "longitude": "113.30",
         "tzOffset": "-7",
         "dstRule": "NAM",
         "tzid": [],
         "#text": "America/Edmonton"
      },
      {
         "name": "Canada, BC, Vancouver",
         "latitude": "49.15",
         "longitude": "123.10",
         "tzOffset": "-8",
         "dstRule": "NAM",
         "tzid": "America/Vancouver"
      },
      {
         "name": "Canada, BC, Victoria",
         "latitude": "48.4222",
         "longitude": "123.3657",
         "tzOffset": "-8",
         "dstRule": "NAM",
         "tzid": "America/Vancouver"
      },
      {
         "name": "Canada, MB, Winnipeg",
         "latitude": "50.38",
         "longitude": "96.19",
         "tzOffset": "-6",
         "dstRule": "NAM",
         "tzid": "America/Winnipeg"
      },
      {
         "name": "Canada, NB, Fredericton",
         "latitude": "45.9500",
         "longitude": "66.6667",
         "tzOffset": "-4",
         "dstRule": "NAM",
         "tzid": "America/Halifax"
      },
      {
         "name": "Canada, NB, Saint John",
         "latitude": "45.2796",
         "longitude": "66.0628",
         "tzOffset": "-4",
         "dstRule": "NAM",
         "tzid": "America/Halifax"
      },
      {
         "name": "Canada, NS, Halifax",
         "latitude": "44.6478",
         "longitude": "63.5714",
         "tzOffset": "-4",
         "dstRule": "NAM",
         "tzid": "America/Halifax"
      },
      {
         "name": "Canada, NL, St. John's",
         "latitude": "47.560539",
         "longitude": "52.712830",
         "tzOffset": "-3.50",
         "dstRule": "NAM",
         "tzid": "America/St_Johns"
      },
      {
         "name": "Canada, ON, Ottawa",
         "latitude": "45.27",
         "longitude": "75.42",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/Toronto"
      },
      {
         "name": "Canada, ON, Toronto",
         "latitude": "43.39",
         "longitude": "79.20",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/Toronto"
      },
      {
         "name": "Canada, PE, Charlottetown",
         "latitude": "46.2400",
         "longitude": "63.1399",
         "tzOffset": "-4",
         "dstRule": "NAM",
         "tzid": "America/Halifax"
      },
      {
         "name": "Canada, QC, Montreal",
         "latitude": "45.50",
         "longitude": "73.5833",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/Toronto"
      },
      {
         "name": "Canada, SK, Regina",
         "latitude": "50.4547",
         "longitude": "104.6067",
         "tzOffset": "-6",
         "dstRule": "OFF",
         "tzid": "America/Winnipeg"
      },
      {
         "name": "Canada, SK, Saskatoon",
         "latitude": "52.1333",
         "longitude": "106.6833",
         "tzOffset": "-6",
         "dstRule": "OFF",
         "tzid": "America/Winnipeg"
      },
      {
         "name": "Cayman Islands, George Town",
         "latitude": "19.3034",
         "longitude": "81.3863",
         "tzOffset": "-5",
         "dstRule": "NAM",
         "tzid": "America/Cayman"
      },
      {
         "name": "Czech Republic, Prague",
         "latitude": "50.0833",
         "longitude": "-14.4167",
         "tzOffset": "1",
         "dstRule": "EU",
         "tzid": "Europe/Prague"
      },
      {
         "name": "Cypress, Nicosia",
         "latitude": "35.1667",
         "longitude": "-33.3667",
         "tzOffset": "2",
         "dstRule": "EU",
         "tzid": "Europe/Chisinau"
      },
      {
         "name": "China,  BJ, Beijing",
         "latitude": "39.9167",
         "longitude": "-116.4167",
         "tzOffset": "8",
         "dstRule": "OFF",
         "tzid": "Asia/Shanghai"
      },
      {
         "name": "China,  GS, Lanzhou",
         "latitude": "36.0333",
         "longitude": "-103.8000",
         "tzOffset": "8",
         "dstRule": "OFF",
         "tzid": "Asia/Shanghai"
      },
      {
         "name": "China,  HK, Hong Kong",
         "latitude": "22.25",
         "longitude": "-114.1667",
         "tzOffset": "8",
         "dstRule": "OFF",
         "tzid": "Asia/Shanghai"
      },
      {
         "name": "China,  SN, Xi'an",
         "latitude": "34.2667",
         "longitude": "-108.9000",
         "tzOffset": "8",
         "dstRule": "OFF",
         "tzid": "Asia/Shanghai"
      },
      {
         "name": "China,  TW, Taiwan",
         "latitude": "23.5000",
         "longitude": "-121.0000",
         "tzOffset": "8",
         "dstRule": "OFF",
         "tzid": "Asia/Shanghai"
      },
      {
         "name": "Colombia, Barranquilla",
         "latitude": "10.9639",
         "longitude": "74.7964",
         "tzOffset": "-5",
         "dstRule": "OFF",
         "tzid": "America/Bogota"
      },
      {
         "name": "Colombia, Bogota",
         "latitude": "4.5981",
         "longitude": "74.0758",
         "tzOffset": "-5",
         "dstRule": "OFF",
         "tzid": "America/Bogota"
      },
      {
         "name": "Colombia, Bucaramanga",
         "latitude": "7.1333",
         "longitude": "73.0000",
         "tzOffset": "-5",
         "dstRule": "OFF",
         "tzid": "America/Bogota"
      },
      {
         "name": "Colombia, Cali",
         "latitude": "3.4525",
         "longitude": "76.5358",
         "tzOffset": "-5",
         "dstRule": "OFF",
         "tzid": "America/Bogota"
      },
      {
         "name": "Colombia, Cartagena",
         "latitude": "10.4000",
         "longitude": "75.5000",
         "tzOffset": "-5",
         "dstRule": "OFF",
         "tzid": "America/Bogota"
      },
      {
         "name": "Colombia, Ibague",
         "latitude": "4.4333",
         "longitude": "75.2333",
         "tzOffset": "-5",
         "dstRule": "OFF",
         "tzid": "America/Bogota"
      },
      {
         "name": "Colombia, Medellin",
         "latitude": "6.2308",
         "longitude": "75.5906",
         "tzOffset": "-5",
         "dstRule": "OFF",
         "tzid": "America/Bogota"
      },
      {
         "name": "Colombia, Neiva",
         "latitude": "2.9986",
         "longitude": "75.3044",
         "tzOffset": "-5",
         "dstRule": "OFF",
         "tzid": "America/Bogota"
      },
      {
         "name": "Colombia, Pereira",
         "latitude": "4.8143",
         "longitude": "75.6946",
         "tzOffset": "-5",
         "dstRule": "OFF",
         "tzid": "America/Bogota"
      },
      {
         "name": "Colombia, Santa Marta",
         "latitude": "11.2419",
         "#text": "74.2053",
         "longitude": [],
         "tzOffset": "-5",
         "dstRule": "OFF",
         "tzid": "America/Bogota"
      },
      {
         "name": "Cuba, Havana",
         "latitude": "23.1333",
         "longitude": "82.3833",
         "tzOffset": "-5",
         "dstRule": "CUB",
         "tzid": "America/Havana"
      },
      {
         "name": "Denmark, Copenhagen",
         "latitude": "55.6761",
         "longitude": "-12.5683",
         "tzOffset": "1",
         "dstRule": "EU",
         "tzid": "Europe/Copenhagen"
      },
      {
         "name": "Egypt, Cairo",
         "latitude": "30.10",
         "longitude": "-31.3667",
         "tzOffset": "2",
         "tzid": "Africa/Cairo"
      },
      {
         "name": "Finland, Helsinki",
         "latitude": "60.1667",
         "longitude": "-24.9667",
         "tzOffset": "2",
         "dstRule": "EU",
         "tzid": "Europe/Helsinki"
      },
      {
         "name": "France, Paris",
         "latitude": "48.8667",
         "longitude": "-2.667",
         "tzOffset": "1",
         "dstRule": "EU",
         "tzid": "Europe/Paris"
      },
      {
         "name": "Germany, Berlin",
         "latitude": "52.33",
         "longitude": "-13.30",
         "tzOffset": "1",
         "dstRule": "EU",
         "tzid": "Europe/Berlin"
      },
      {
         "name": "Greece, Athens",
         "latitude": "37.9667",
         "longitude": "-23.7167",
         "tzOffset": "2",
         "dstRule": "EU",
         "tzid": "Europe/Athens"
      },
      {
         "name": "Haiti, Port-au-Prince",
         "latitude": "18.5333",
         "longitude": "72.3333",
         "tzOffset": "-4",
         "dstRule": "NAM",
         "tzid": "America/Port-au-Prince"
      },
      {
         "name": "Hungary, Budapest",
         "latitude": "47.4925",
         "longitude": "-19.0514",
         "tzOffset": "1",
         "dstRule": "EU",
         "tzid": "Europe/Budapest"
      },
      {
         "name": "India, Bombay",
         "latitude": "18.9333",
         "longitude": "-72.8333",
         "tzOffset": "5.5",
         "dstRule": "OFF",
         "tzid": "Asia/Calcutta"
      },
      {
         "name": "India, New Delhi",
         "latitude": "28.6",
         "longitude": "-77.2",
         "tzOffset": "5.5",
         "dstRule": "OFF",
         "tzid": "Asia/Calcutta"
      },
      {
         "name": "Iran, Tehran",
         "latitude": "35.6961",
         "longitude": "-51.4231",
         "tzOffset": "3.5",
         "dstRule": "IRAN",
         "tzid": "Asia/Tehran"
      },
      {
         "name": "Ireland, Dublin",
         "latitude": "53.3478",
         "longitude": "6.2597",
         "tzOffset": "0",
         "dstRule": "EU",
         "tzid": "Europe/Dublin"
      },
      {
         "name": "Israel, Jerusalem",
         "latitude": "31.7833",
         "longitude": "-35.2333",
         "tzOffset": "2",
         "dstRule": "ISRL",
         "tzid": "Asia/Jerusalem"
      },
      {
         "name": "Israel, Tel Aviv",
         "latitude": "32.0667",
         "longitude": "-34.8000",
         "tzOffset": "2",
         "dstRule": "ISRL",
         "tzid": "Asia/Jerusalem"
      },
      {
         "name": "Italy, Rome",
         "latitude": "41.90",
         "longitude": "-12.4833",
         "tzOffset": "1",
         "dstRule": "EU",
         "tzid": "Europe/Rome"
      },
      {
         "name": "Japan, Tokyo",
         "latitude": "35.70",
         "longitude": "-139.7667",
         "tzOffset": "9",
         "dstRule": "OFF",
         "tzid": "Asia/Tokyo"
      },
      {
         "name": "Jordan, Amman",
         "latitude": "31.9497",
         "longitude": "-35.9328",
         "tzOffset": "2",
         "dstRule": "JOR",
         "tzid": "Asia/Amman"
      },
      {
         "name": "Lebanon, Beirut",
         "latitude": "33.8869",
         "longitude": "-35.5131",
         "tzOffset": "2",
         "dstRule": "LEB",
         "tzid": "Asia/Beirut"
      },
      {
         "name": "Mexico, Baja California, Tijuana",
         "latitude": "30.0000",
         "longitude": "115.1667",
         "tzOffset": "-8",
         "dstRule": "MEX",
         "tzid": "America/Tijuana"
      },
      {
         "name": "Mexico, Distrito Federal, Mexico City",
         "latitude": "19.4333",
         "longitude": "99.1333",
         "tzOffset": "-6",
         "dstRule": "MEX",
         "tzid": "America/Mexico_City"
      },
      {
         "name": "Mexico, Jalisco, Guadalajara",
         "latitude": "20.6667",
         "longitude": "103.3500",
         "tzOffset": "-5",
         "dstRule": "MEX",
         "tzid": "America/Cancun"
      },
      {
         "name": "Mexico, México, Ecatepec",
         "latitude": "19.6097",
         "longitude": "99.0600",
         "tzOffset": "-5",
         "dstRule": "MEX",
         "tzid": "America/Cancun"
      },
      {
         "name": "Mexico, Nuevo León, Monterey",
         "latitude": "25.6667",
         "longitude": "100.3000",
         "tzOffset": "-6",
         "dstRule": "MEX",
         "tzid": "America/Mexico_City"
      },
      {
         "name": "Moldova, Chișinău",
         "latitude": "47.0000",
         "longitude": "-28.9167",
         "tzOffset": "2",
         "dstRule": "MOL",
         "tzid": "Europe/Chisinau"
      },
      {
         "name": "Mongolia, Ulaanbaatar",
         "latitude": "47.9200",
         "longitude": "-106.9200",
         "tzOffset": "8",
         "dstRule": "MONG",
         "tzid": "Asia/Ulaanbaatar"
      },
      {
         "name": "Namibia, Windhoek",
         "latitude": "-22.5700",
         "longitude": "-17.0836",
         "tzOffset": "1",
         "dstRule": "NMIB",
         "tzid": "Africa/Windhoek"
      },
      {
         "name": "Netherlands, Amsterdam",
         "latitude": "52.3667",
         "longitude": "-4.9000",
         "tzOffset": "1",
         "dstRule": "EU",
         "tzid": "Europe/Amsterdam"
      },
      {
         "name": "New Zealand, Wellignton",
         "latitude": "-41.2889",
         "longitude": "-174.7772",
         "tzOffset": "12",
         "dstRule": "NZL",
         "tzid": "Pacific/Auckland"
      },
      {
         "name": "New Zealand, Auckland",
         "latitude": "-36.8406",
         "longitude": "-174.7400",
         "tzOffset": "12",
         "dstRule": "NZLAL",
         "tzid": "Pacific/Auckland"
      },
      {
         "name": "Norway, Oslo",
         "latitude": "59.9500",
         "longitude": "-10.7500",
         "tzOffset": "1",
         "dstRule": "EU",
         "tzid": "Europe/Oslo"
      },
      {
         "name": "Papau New Guinea, Manus Island",
         "latitude": "-2.06",
         "longitude": "-147.425",
         "tzOffset": "10",
         "dstRule": "OFF",
         "tzid": "Pacific/Port_Moresby"
      },
      {
         "name": "Paraguay, Asunción",
         "latitude": "-25.2667",
         "longitude": "57.6333",
         "tzOffset": "-4",
         "dstRule": "PAR",
         "tzid": "America/Asuncion"
      },
      {
         "name": "Poland, Warsaw",
         "latitude": "52.2333",
         "longitude": "-21.0167",
         "tzOffset": "1",
         "dstRule": "EU",
         "tzid": "Europe/Warsaw"
      },
      {
         "name": "Portugal, Lisbon",
         "latitude": "38.7139",
         "longitude": "9.1394",
         "tzOffset": "0",
         "dstRule": "EU",
         "tzid": "Europe/Lisbon"
      },
      {
         "name": "Russia, Moscow",
         "latitude": "55.75",
         "longitude": "-37.5833",
         "tzOffset": "3",
         "dstRule": "OFF",
         "tzid": "Europe/Moscow"
      },
      {
         "name": "Saudi Arabia, Riyadh",
         "latitude": "24.633",
         "longitude": "-46.71667",
         "tzOffset": "3",
         "dstRule": "OFF",
         "tzid": "Asia/Riyadh"
      },
      {
         "name": "South Africa, Cape Town",
         "latitude": "-33.9167",
         "longitude": "-18.3667",
         "tzOffset": "2",
         "dstRule": "OFF",
         "tzid": "Africa/Johannesburg"
      },
      {
         "name": "Spain, Madrid",
         "latitude": "40.4000",
         "longitude": "3.7167",
         "tzOffset": "1",
         "dstRule": "EU",
         "tzid": "Europe/Madrid"
      },
      {
         "name": "Sweden, Stockholm",
         "latitude": "59.3294",
         "longitude": "-18.0686",
         "tzOffset": "1",
         "dstRule": "EU",
         "tzid": "Europe/Stockholm"
      },
      {
         "name": "Switzerland, Zurich",
         "latitude": "47.3833",
         "longitude": "-8.5333",
         "tzOffset": "1",
         "dstRule": "EU",
         "tzid": "Europe/Zurich"
      },
      {
         "name": "Turkey, Ankara",
         "latitude": "39.9333",
         "longitude": "-32.8667",
         "tzOffset": "2",
         "dstRule": "OFF",
         "tzid": "Europe/Istanbul"
      },
      {
         "name": "UK, England, London",
         "latitude": "51.50",
         "longitude": "0.1667",
         "tzOffset": "-0",
         "dstRule": "EU",
         "tzid": "Europe/London"
      },
      {
         "name": "Venezuela, Caracas",
         "latitude": "10.50",
         "longitude": "66.9333",
         "tzOffset": "-4",
         "dstRule": "OFF",
         "tzid": "America/Caracas"
      },
      {
         "name": "Western Samoa, Apia",
         "latitude": "-13.8333",
         "longitude": "171.7500",
         "tzOffset": "13",
         "dstRule": "WSAM",
         "tzid": "Pacific/Apia"
      }
   ]

   private nicAllTest = {
      "NICs": [
        {
          "name": "ath0",
          "logicalName": "wlan0",
          "mac": "ffffffac:ffffffd1:ffffffb8:5c:fffffff4:fffffff5",
          "isEnabledIPv4": true,
          "isEnabledIPv6": false,
          "isRunning": true,
          "isDHCP": true,
          "isRTADV": false,
          "isWiFi": true,
          "IPInfo": {
            "ip": "10.0.0.109",
            "ipV6": "::",
            "mask": "255.255.255.0",
            "gateway": "0.0.0.0",
            "gatewayV6": "::"
          },
          "WiFiInfo": {
            "ssid": "Milne-GW",
            "bssid": "60:a4:4c:a1:05:30",
            "rate": 54,
            "channel": 8,
            "bars": 64,
            "supportedProtocols": "RSN",
            "keyManagement": "PSK",
            "isRemembered": true
          }
        },
        {
          "name": "igb0",
          "logicalName": "igb0",
          "mac": "00:0d:ffffffb9:4e:3a:5c",
          "isEnabledIPv4": true,
          "isEnabledIPv6": true,
          "isRunning": true,
          "isDHCP": true,
          "isRTADV": true,
          "isWiFi": false,
          "IPInfo": {
            "ip": "10.0.0.114",
            "ipV6": "2600:1700:8bb0:389f:20d:b9ff:fe4e:3a5c",
            "mask": "255.255.255.0",
            "gateway": "0.0.0.0",
            "gatewayV6": "::",
            "dns1": "8.8.4.4",
            "dns2": "8.8.8.8",
            "dns3": "10.0.0.75"
          }
        },
        {
          "name": "igb1",
          "logicalName": "igb1",
          "mac": "00:0d:ffffffb9:4e:3a:5d",
          "isEnabledIPv4": true,
          "isEnabledIPv6": true,
          "isRunning": false,
          "isDHCP": true,
          "isRTADV": true,
          "isWiFi": false,
          "IPInfo": {
            "ip": "0.0.0.0",
            "ipV6": "fe80::20d:b9ff:fe4e:3a5d",
            "mask": "0.0.0.0",
            "gateway": "0.0.0.0",
            "gatewayV6": "::"
          }
        },
        {
          "name": "igb2",
          "logicalName": "igb2",
          "mac": "00:0d:ffffffb9:4e:3a:5e",
          "isEnabledIPv4": false,
          "isEnabledIPv6": false,
          "isRunning": false,
          "isDHCP": false,
          "isRTADV": false,
          "isWiFi": false,
          "IPInfo": {
            "ip": "0.0.0.0",
            "ipV6": "::",
            "mask": "0.0.0.0",
            "gateway": "0.0.0.0",
            "gatewayV6": "::"
          }
        }
      ]
    }

   private dateTimeTest = {"name":"USA, CA, Los Angeles","dstRule":"NAM","tzid":"America/Los_Angeles","latitude":34.05,"longitude":118.233,"tzOffset":-8}

   constructor(
      private fb: FormBuilder,
      private sockets: WebsocketsService,
      private router: Router,
      private flashMessage: FlashMessagesService,
      private settingsService: SettingsService,
      private modal: NgbModal,
      public authService: AuthService
   ) {
      const ipPattern = /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/

      this.nicForm = this.fb.group({
         "name": "",
         "logicalName": "",
         "mac": "",
         "isEnabledIPv4": false,
         "isEnabledIPv6": false,
         "isDHCP": false,
         "isRTADV": false,
         "isWiFi": false,
         "IPInfo": this.fb.group({
            "ip": ["0.0.0.0", Validators.pattern(ipPattern)],
            "ipV6": ["::", Validators.pattern(ipPattern)],
            "mask": ["0.0.0.0", Validators.pattern(ipPattern)],
            "gateway": ["0.0.0.0", Validators.pattern(ipPattern)],
            "gatewayV6": ["::", Validators.pattern(ipPattern)],
            "dns1": "0.0.0.0",
            "dns2": "0.0.0.0",
            "dns3": "0.0.0.0"
         })
      })

      this.subscription.add(this.sockets.mqttConnected.subscribe(connected => {
         this.mqttConnected = connected
      }))

      this.subscription.add(this.sockets.polisyNicsData.subscribe(nics => {
         //console.log(nics)
         if (nics && nics.hasOwnProperty('NICs')) {
            this.polisyNics = nics.NICs
            if (!this.selectedNic) {
               this.selectedNic = this.polisyNics.find(nic => nic['isEnabledIPv4'] )
               this.nicForm.patchValue(this.selectedNic)
            } else {
               if (!this.nicForm.dirty) {
                  this.nicForm.patchValue(this.polisyNics.find(nic => nic.logicalName === this.selectedNic.logicalName))
               }
            }
            if (this.selectedNic && this.selectedNic.isWiFi && !this.gotWifi) {
               this.scanWifi()
            }
            if (this.selectedNic) {
               this.dhcpChecked = this.selectedNic.isDHCP
               this.nicEnabled = this.selectedNic.isEnabledIPv4
               this.ipv6Enabled = this.selectedNic.isEnabledIPv6
               this.rtadvChecked = this.selectedNic.isRTADV
            }
         }
      }))

      this.subscription.add(this.sockets.polisyNicData.subscribe(nic => {
         //console.log(nic)
         if (nic) {
            if (nic.name === this.selectedNic.name) {
               this.selectedNic = nic
               if (!this.nicForm.dirty) {
                  this.nicForm.patchValue(this.selectedNic)
               }
            }
            let index = this.polisyNics.findIndex(element => element.name === nic.name)
            if (index > -1) {
                  this.polisyNics[index] = nic
            }

            if (this.selectedNic.isWiFi && !this.gotWifi) {
               this.scanWifi()
            }
         }
      }))

      this.subscription.add(this.sockets.polisyWifiData.subscribe(wifi => {
         //console.log(wifi)
         if (wifi && wifi.hasOwnProperty('WiFiNetworks')) {
            this.flashMessage.show(`Successfully got WiFi networks...`, {
               cssClass: 'alert-success',
               timeout: 3000})
            this.polisyWifi = wifi.WiFiNetworks
            this.selectedWifi = this.polisyWifi[0]
            this.gotWifi = true
         }
      }))

      this.subscription.add(this.sockets.polisyDatetimeAllData.subscribe(datetimes => {
         if (datetimes) {
            this.polisyDatetimes = datetimes.sort((a, b) => { return parseInt(a.tzOffset, 10) - parseInt(b.tzOffset, 10) })
            if (!this.selectedDatetime && this.currentDatetime) {
               this.selectedDatetime = this.polisyDatetimes.find(datetime => datetime['name'] === this.currentDatetime['name'] )
            }
         }
      }))

      this.subscription.add(this.sockets.polisyDatetimeData.subscribe(datetime => {
         //console.log(datetime)
         if (datetime) {
            this.currentDatetime = datetime
            this.selectedDatetime = datetime
         }
      }))

   }

   ngOnInit() {
      this.getPolisyData()
   }

   ngOnDestroy() {
      this.subscription.unsubscribe()
   }

   f(name) { return this.nicForm.get(`${name}`) }

   getPolisyData() {
      this.sockets.sendMessage('config/network/nics', null)
      this.sockets.sendMessage('config/datetime', null)
      this.sockets.sendMessage('config/datetime/all', null)

      /*
      setTimeout(() => {
         this.sockets.sendMessage('sconfig/network/nics', this.nicAllTest)
         this.sockets.sendMessage('sconfig/datetime', this.dateTimeTest)
         this.sockets.sendMessage('sconfig/datetime/all', this.dateTimeAllTest)
      }, 1000)
      */
   }


   confirmTz() {
      if (this.currentDatetime && (this.selectedDatetime.name === this.currentDatetime['name'])) {
         this.flashMessage.show('No change detected.', {
            cssClass: 'alert-danger',
            timeout: 3000})
         window.scrollTo(0, 0)
      } else {
         const modalRef = this.modal.open(ConfirmComponent, { centered: true })
         modalRef.componentInstance.title = `Change Timezone?`
         modalRef.componentInstance.body = `Are you sure you want to change the timezone to ${this.selectedDatetime.name}?`
         modalRef.result.then(isConfirmed => {
               this.changeTz(isConfirmed)
         }).catch(error => console.log(error))
      }
   }

   confirmNic() {
      if (!this.nicForm.dirty &&
         this.selectedNic.isEnabledIPv4 === this.nicEnabled && this.selectedNic.isDHCP === this.dhcpChecked &&
         this.selectedNic.isEnabledIPv6 === this.ipv6Enabled && this.selectedNic.isRTADV === this.rtadvChecked
         ) {
         this.flashMessage.show(`No Changes detected to ${this.selectedNic.logicalName}`, {
            cssClass: 'alert-danger',
            timeout: 5000})
         window.scrollTo(0, 0)
      } else {
         const modalRef = this.modal.open(ConfirmComponent, { centered: true })
         modalRef.componentInstance.title = `Change Network Configuration?`
         modalRef.componentInstance.body = `Are you sure you want to change the network configuration for ${this.selectedNic.logicalName}?`
         modalRef.result.then(isConfirmed => {
               this.changeNic(isConfirmed)
         }).catch(error => console.log(error))
      }
   }

   selectTz(index) {
      this.selectedDatetime = this.polisyDatetimes[index]
   }

   changeTz(confirmed) {
   //console.log(this.selectedDatetime)
   if (!confirmed) { return }
      this.sockets.sendMessage('config/datetime/set', this.selectedDatetime)
      this.currentDatetime = this.selectedDatetime
      this.flashMessage.show(`Updated Timezone to ${this.selectedDatetime.name}`, {
         cssClass: 'alert-success',
         timeout: 3000})
      window.scrollTo(0, 0)
   }

   selectNic(index) {
      this.selectedNic = this.polisyNics[index]
      this.nicForm.patchValue(this.selectedNic)
      // DNS is consistent across interfaces
      if (!this.selectedNic.IPInfo.hasOwnProperty('dns1')) { this.nicForm.patchValue({IPInfo: {dns1: '0.0.0.0'}})}
      if (!this.selectedNic.IPInfo.hasOwnProperty('dns2')) { this.nicForm.patchValue({IPInfo: {dns2: '0.0.0.0'}})}
      if (!this.selectedNic.IPInfo.hasOwnProperty('dns3')) { this.nicForm.patchValue({IPInfo: {dns3: '0.0.0.0'}})}
      this.dhcpChecked = this.selectedNic.isDHCP
      this.nicEnabled = this.selectedNic.isEnabledIPv4
      this.ipv6Enabled = this.selectedDatetime.isEnabledIPv6
      this.rtadvChecked = this.selectedNic.isRTADV
      if (this.selectedNic.isWiFi) {
         this.scanWifi()
      }
   }

   scanWifi() {
      window.scrollTo(0, 0)
      this.flashMessage.show(`Scanning for WiFi networks on ${this.selectedNic.logicalName}...`, {
         cssClass: 'alert-success',
         timeout: 3000})
      this.sockets.sendMessage(`config/network/nic/${this.selectedNic.logicalName}/scan`, null)
   }

   selectWifi(index) {
      this.selectedWifi = this.polisyWifi[index]
   }

   forgetWifi() {
      if (this.selectedNic.hasOwnProperty('WiFiInfo') && this.selectedNic.WiFiInfo.hasOwnProperty('ssid')) {
         this.sockets.sendMessage(`config/network/wifi/forget`, {ssid: this.selectedNic.WiFiInfo.ssid})
         this.flashMessage.show(`Forgot WiFi SSID ${this.selectedWifi.ssid}`, {
            cssClass: 'alert-success',
            timeout: 3000})
         window.scrollTo(0, 0)
      } else {
         this.flashMessage.show(`Not connected to WiFi.`, {
            cssClass: 'alert-danger',
            timeout: 3000})
         window.scrollTo(0, 0)
      }
   }

   forgetAllWifi() {
      this.sockets.sendMessage(`config/network/wifi/forgetall`, null)
      this.flashMessage.show(`Forgot All WiFi SSIDs`, {
         cssClass: 'alert-success',
         timeout: 3000})
      window.scrollTo(0, 0)
   }

   saveWifi() {
      this.sockets.sendMessage(`config/network/wifi/associate`, {
         ssid: this.selectedWifi.ssid,
         psk: this.wifiKey
      })
      this.wifiKey = undefined
      this.flashMessage.show(`Configured ${this.selectedWifi.ssid} with Key. Connecting...`, {
         cssClass: 'alert-success',
         timeout: 3000})
      window.scrollTo(0, 0)
   }

   changeNic(confirmed) {
      if (!confirmed) { return }
      this.nicSubmitted = true
      //console.log(this.nicForm.get('IPInfo').errors)
      //console.log(this.nicForm.value)
      if (this.selectedNic.isEnabledIPv4 && !this.nicEnabled) {
         this.flashMessage.show(`Disabled interface ${this.selectedNic.logicalName}`, {
            cssClass: 'alert-success',
            timeout: 5000})
         setTimeout(() => {
            window.scrollTo(0, 0)
         },100)
         return this.sockets.sendMessage(`config/network/nic/${this.selectedNic.name}/disable`, null)
      } else if (!this.selectedNic.isEnabledIPv4 && this.nicEnabled) {
         this.flashMessage.show(`Enabled interface ${this.selectedNic.logicalName}`, {
            cssClass: 'alert-success',
            timeout: 5000})
         setTimeout(() => {
            window.scrollTo(0, 0)
         },100)
         this.sockets.sendMessage(`config/network/nic/${this.selectedNic.name}/enable`, null)
      }
      if (!this.selectedNic.isDHCP && this.dhcpChecked) {
         this.flashMessage.show(`Enabling DHCP on ${this.selectedNic.logicalName}`, {
            cssClass: 'alert-success',
            timeout: 5000})
         setTimeout(() => {
            window.scrollTo(0, 0)
         },100)
         this.sockets.sendMessage(`config/network/nic/${this.selectedNic.name}/dhcp/ipv4`, null)
      } else if (!this.dhcpChecked) {
         if (this.nicForm.invalid) {
            this.flashMessage.show('Malformed IPv4 Address in the form. Please verify your entries.', {
               cssClass: 'alert-danger',
               timeout: 5000})
            setTimeout(() => {
               window.scrollTo(0, 0)
            },100)
         } else {
            if ([this.nicForm.value.IPInfo.gateway, this.nicForm.value.IPInfo.ip].includes('0.0.0.0')) {
               this.flashMessage.show(`IP Address nor Gateway can be 0.0.0.0 when setting static IP addresses for ${this.selectedNic.logicalName}`, {
                  cssClass: 'alert-danger',
                  timeout: 5000})
               return setTimeout(() => {
                  window.scrollTo(0, 0)
               },100)
            }
            this.flashMessage.show(`Updated static address settings for ${this.selectedNic.logicalName}`, {
               cssClass: 'alert-success',
               timeout: 3000})
            const msg = {
               ip: this.nicForm.value.IPInfo.ip,
               gateway: this.nicForm.value.IPInfo.gateway,
               mask: this.nicForm.value.IPInfo.mask,
               dns1: this.nicForm.value.IPInfo.dns1,
               dns2: this.nicForm.value.IPInfo.dns2,
               dns3: this.nicForm.value.IPInfo.dns3,
            }
            setTimeout(() => {
               window.scrollTo(0, 0)
            },100)
            this.sockets.sendMessage(`config/network/nic/${this.selectedNic.name}/static/ipv4`, msg)
         }
      }
      if (this.allowIpv6) {
         if (this.selectedNic.isEnabledIPv6 && !this.ipv6Enabled) {
            this.flashMessage.show(`Disabled IPv6 for interface ${this.selectedNic.logicalName}`, {
               cssClass: 'alert-success',
               timeout: 5000})
            setTimeout(() => {
               window.scrollTo(0, 0)
            },100)
            this.sockets.sendMessage(`config/network/nic/${this.selectedNic.name}/disable/ipv6`, null)
         } else if (!this.selectedNic.isEnabledIPv6 && this.ipv6Enabled) {
            this.flashMessage.show(`Enabled IPV6 for interface ${this.selectedNic.logicalName}`, {
               cssClass: 'alert-success',
               timeout: 5000})
            setTimeout(() => {
               window.scrollTo(0, 0)
            },100)
            this.sockets.sendMessage(`config/network/nic/${this.selectedNic.name}/enable/ipv6`, null)
         }
         if (!this.selectedNic.isRTADV && this.rtadvChecked) {
            this.flashMessage.show(`Enabling IPv6 Router Advertisment auto configuration for ${this.selectedNic.logicalName}`, {
               cssClass: 'alert-success',
               timeout: 5000})
            setTimeout(() => {
               window.scrollTo(0, 0)
            },100)
            this.sockets.sendMessage(`config/network/nic/${this.selectedNic.name}/dhcp/ipv6`, null)
         } else if (!this.rtadvChecked) {
            if ([this.nicForm.value.IPInfo.ipV6, this.nicForm.value.IPInfo.gatewayV6, this.nicForm.value.IPInfo.v6dns1].includes('::')) {
               this.flashMessage.show(`IPv6 Address, nor Gateway can be blank or '::' when setting static IPv6 addresses for ${this.selectedNic.logicalName}`, {
                  cssClass: 'alert-danger',
                  timeout: 5000})
               return setTimeout(() => {
                  window.scrollTo(0, 0)
               },100)
            }
            this.flashMessage.show(`Updated IPv6 static address settings for ${this.selectedNic.logicalName}`, {
               cssClass: 'alert-success',
               timeout: 3000})
            const msg = {
               ip: this.nicForm.value.IPInfo.ipV6,
               gateway: this.nicForm.value.IPInfo.gatewayV6,
               dns1: this.nicForm.value.IPInfo.dns1,
               dns2: this.nicForm.value.IPInfo.dns2,
               dns3: this.nicForm.value.IPInfo.dns3,
            }
            setTimeout(() => {
               window.scrollTo(0, 0)
            },100)
            this.sockets.sendMessage(`config/network/nic/${this.selectedNic.name}/static/ipv6`, msg)
         }
      }
   }
}
