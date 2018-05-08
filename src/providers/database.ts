import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import { User } from '@models/user';
import { Photo } from '@models/photo';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import image2base64 from 'image-to-base64';

@Injectable()
export class DatabaseProvider {
  private db: any;
  private photos: Array<Photo>;
  public photosSubject = new Subject<Photo[]>();

  constructor() {}

  public get() {
    return this.db;
  }

  public setup(user: User) {
    this.db = new PouchDB(`geophoto_${user.uid}`);
  }

  public emitPhotosSubject() {
    this.photosSubject.next(this.photos.slice());
  }

  public getFavPhoto(photo: Photo) {
    let like = this.db
      .get(photo.name)
      .then(favPhoto => favPhoto)
      .catch(error => null);

    return Observable.fromPromise(like);
  }

  public toFavPhoto(photo: Photo, index: number) {
    let like = this.db
      .get(photo.name)
      .then(favPhoto => {
        this.photos.splice(index, 1);
        this.emitPhotosSubject();
        this.db.remove(favPhoto);
      })
      .catch(error => {
        image2base64(`https://i2.wp.com/beebom.com/wp-content/uploads/2016/01/Reverse-Image-Search-Engines-Apps-And-Its-Uses-2016.jpg?w=640&ssl=1`)
        //image2base64(photo.pictureURL)
          .then(response => {
            photo.pictureURL = `data:image/jpeg;base64,${response}`;
            this.db
              .put({ _id: photo.name, photo })
              .then(result => console.log('result', result))
              .catch(error => console.error('error', error));
          })
          .catch(error => console.log(error));
      });

    return Observable.fromPromise(like);
  }

  public removeFavPhoto(photo: Photo) {
    let like = this.db
      .get(photo.name)
      .then(favPhoto => this.db.remove(favPhoto))
      .catch(error => console.error('error', error));

    return Observable.fromPromise(like);
  }

  public listFavPhoto() {
    this.photos = [];
    let likes = this.db
      .allDocs({ include_docs: true })
      .then(result => {
        let docs = result.rows;
        docs.forEach(row => {
          this.photos.push(row.doc.photo);
        });
        this.sortPhotos();
        this.emitPhotosSubject();
      })
      .catch(error => console.error('error', error));

    return Observable.fromPromise(likes);
  }

  private sortPhotos() {
    this.photos.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}
