import { Injectable } from '@angular/core'

@Injectable()
export class ValidateService {

  constructor() { }

 validateRegister(node) {
   if (node.name === undefined || node.profileNum === undefined || node.type === undefined) {
     return false
   } else {
     return true
   }
 }

 validateProfileNum(profileNum) {
   return profileNum >= 1 && profileNum < 26
 }

}
