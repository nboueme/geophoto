import { Component } from '@angular/core';
import { NavController, NavParams, FabContainer } from 'ionic-angular';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Observable } from 'rxjs/Observable';
import firebase from 'firebase';
import { FireAuthProvider } from '../../providers/fire-auth/fire-auth';
import { AngularFireAuth } from 'angularfire2/auth';
import { PhotoInfoPage } from '../photo-info/photo-info';
import { User } from '../../models/user';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  photosRef: firebase.database.Reference = firebase.database().ref(`photos`);
  photos: Array<any> = [];
  user = {} as User;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private fireAuth: FireAuthProvider,
    private afAuth: AngularFireAuth,
    private camera: Camera
  ) {}

  ionViewDidLoad() {
    this.afAuth.authState.subscribe(user => {
      if (user && user.email && user.uid) {
        firebase
          .database()
          .ref(`users/`)
          .child(user.uid)
          .once('value')
          .then(data => {
            this.user.uid = user.uid;
            this.user.pseudo = data.val().pseudo;
            this.user.email = data.val().email;
            this.user.avatarURL = data.val().avatarURL;
            this.fireAuth.setUserSession(this.user);
          });
      }
    });

    this.photosRef.orderByChild('createdAt').on('value', itemSnapshot => {
      this.photos = [];
      itemSnapshot.forEach(itemSnap => {
        this.photos.push(itemSnap.val());
        return false;
      });
    });
  }

  goToPhotoInfo(photo) {
    this.navCtrl.push(PhotoInfoPage, { photo });
  }

  takePicture(fab: FabContainer) {
    fab.close();

    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      sourceType: this.camera.PictureSourceType.CAMERA,
      allowEdit: false,
      targetWidth: 1280,
      targetHeight: 720
    };

    this.camera
      .getPicture(options)
      .then(picture => {
        const currentDate = new Date();
        const selfieRef = firebase
          .storage()
          .ref(`photos/${this.user.uid}/photo-${currentDate.getTime()}.jpg`);
        selfieRef
          .putString(picture, 'base64', { contentType: 'image/jpeg' })
          .then(savedPicture => {
            this.photosRef.push({
              createdAt: currentDate.toJSON(),
              pictureURL: savedPicture.downloadURL,
              user: {
                avatarURL: this.fireAuth.getUserSession().avatarURL,
                pseudo: this.fireAuth.getUserSession().pseudo,
                userID: this.user.uid
              }
            });
          });
      })
      .catch(error => console.log('error', error));
  }
}
