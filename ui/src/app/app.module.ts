import { BrowserModule, Title } from '@angular/platform-browser';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { FlashMessagesModule } from 'angular2-flash-messages';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'
import { Injector, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'

import { SettingsService } from './services/settings.service';
import { WebsocketsService } from './services/websockets.service';
import { FlashMessagesService } from 'angular2-flash-messages';
import { AddnodeService } from './services/addnode.service';
import { ValidateService } from './services/validate.service';
import { ValidateparamsService } from './services/validateparams.service';
import { AuthService } from './services/auth.service';

import { AuthGuard } from './guards/auth.guard';

import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AddnodeComponent } from './components/addnode/addnode.component';
import { HomeComponent } from './components/home/home.component';
import { ProfileComponent } from './components/profile/profile.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { SettingsComponent } from './components/settings/settings.component';
import { FooterComponent } from './components/footer/footer.component';
import { ConfirmComponent } from './components/confirm/confirm.component';
import { NodepopComponent } from './components/nodepop/nodepop.component';
import { DriverpopComponent } from './components/driverpop/driverpop.component';
import { NsdetailsComponent } from './components/nsdetails/nsdetails.component';
import { NodedetailsComponent } from './components/nodedetails/nodedetails.component';
import { CustomdetailsComponent } from './components/customdetails/customdetails.component';
import { ShowlogComponent } from './components/showlog/showlog.component';
import { GetnsComponent } from './components/getns/getns.component';
import { ModalNsUpdateComponent } from './components/modal-ns-update/modal-ns-update.component';
import { ModalNsAddComponent } from './components/modal-ns-add/modal-ns-add.component';
import { NsnoticesComponent } from './components/nsnotices/nsnotices.component';

import { DropdownDirective } from "./components/navbar/dropdown";
import { CustomparamComponent } from './components/params/customparam/customparam.component';
import { CustomparamsetComponent } from './components/params/customparamset/customparamset.component';
import { CustomparamlistComponent } from './components/params/customparamlist/customparamlist.component';
import { SafePipe } from './pipes/safe.pipe';
import { PolisyconfComponent } from './components/polisyconf/polisyconf.component'

const appRoutes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'login', component: LoginComponent},
  {path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]},
  {path: 'profile', component: ProfileComponent, canActivate: [AuthGuard]},
  {path: 'addnode', component: AddnodeComponent, canActivate: [AuthGuard]},
  {path: 'settings', component: SettingsComponent, canActivate: [AuthGuard]},
  {path: 'polisyconf', component: PolisyconfComponent, canActivate: [AuthGuard]},
  {path: 'log', component: ShowlogComponent, canActivate: [AuthGuard]},
  {path: 'getns', component: GetnsComponent, canActivate: [AuthGuard]},
  {path: 'nsdetails/:id', component: NsdetailsComponent, canActivate: [AuthGuard]},
  {path: '**', redirectTo: ''}
]

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    AddnodeComponent,
    HomeComponent,
    ProfileComponent,
    DashboardComponent,
    LoginComponent,
    SettingsComponent,
    FooterComponent,
    ConfirmComponent,
    NodepopComponent,
    DriverpopComponent,
    NsdetailsComponent,
    NodedetailsComponent,
    CustomdetailsComponent,
    ShowlogComponent,
    GetnsComponent,
    ModalNsUpdateComponent,
    ModalNsAddComponent,
    NsnoticesComponent,
    DropdownDirective,
    CustomparamComponent,
    CustomparamsetComponent,
    CustomparamlistComponent,
    SafePipe,
    PolisyconfComponent,
  ],
  imports: [
    BrowserModule,
    CollapseModule.forRoot(),
    FlashMessagesModule,
    FormsModule,
    NgbModule,
    HttpClientModule,
    ReactiveFormsModule,
    RouterModule.forRoot(appRoutes),
    TooltipModule.forRoot()
  ],
  entryComponents: [
    ConfirmComponent,
    NodepopComponent,
    ModalNsUpdateComponent,
    ModalNsAddComponent,
  ],
  providers: [
    Title,
    AuthService,
    AuthGuard,
    SettingsService,
    WebsocketsService,
    FlashMessagesService,
    AddnodeService,
    ValidateService,
    ValidateparamsService
   ],
  bootstrap: [AppComponent]
})
export class AppModule { }
