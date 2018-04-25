import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { PhotoInfoPage } from './../photo-info/photo-info';
import { FirePhotoProvider } from '../../providers/fire-photo/fire-photo';
import { Photo } from '../../models/photo';

@Component({
  selector: 'page-account-photos',
  templateUrl: 'account-photos.html'
})
export class AccountPhotosPage {
  photos: Observable<Photo[]>;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private firePhoto: FirePhotoProvider
  ) {
    this.photos = this.firePhoto
      .listbyUserFromFirebase()
      .valueChanges()
      .map(photos =>
        photos.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    /*.map(photos =>
        photos.reverse().filter(photo => photo.user.uid == this.user.uid)
      );*/
  }

  goToPhotoInfo(photo) {
    this.navCtrl.push(PhotoInfoPage, { photo });
  }
}
