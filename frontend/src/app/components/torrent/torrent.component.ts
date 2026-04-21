import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiService, Torrent} from '../../api.service';
import {Observable} from 'rxjs';
import {switchMap, take} from 'rxjs/operators';

const PRIORITY_SKIP = 0;

@Component({
  selector: 't-torrent',
  templateUrl: './torrent.component.html',
  styleUrls: ['./torrent.component.scss']
})
export class TorrentComponent implements OnInit {
  @Input('hash') hash: string;
  @Input('torrent') torrent: Torrent;
  @Input('label') label: string;
  @Output('removed') removed = new EventEmitter<boolean>();

  constructor(private api: ApiService) {
  }

  ngOnInit(): void {
  }

  get selectedSize(): number {
    if (!this.torrent?.Files?.length || !this.torrent?.FilePriorities?.length) {
      return this.torrent?.TotalSize || 0;
    }
    return this.torrent.Files.reduce((sum, file, i) => {
      const priority = this.torrent.FilePriorities[i];
      return priority !== PRIORITY_SKIP ? sum + file.Size : sum;
    }, 0);
  }

  private refreshAfter(action: Observable<any>): void {
    action.pipe(
      switchMap(_ => this.api.torrent(this.hash)),
      take(1),
    ).subscribe(
      torrent => this.torrent = torrent
    );
  }

  public onPause(): void {
    this.refreshAfter(this.api.pause(this.hash));
  }

  public onResume(): void {
    this.refreshAfter(this.api.resume(this.hash));
  }

  public onChangeState(): void {
    if (this.torrent.State === 'Paused') {
      this.onResume();
      return;
    }

    this.onPause();
  }

  public onPrioritiesChanged(priorities: number[]): void {
    this.torrent = {
      ...this.torrent,
      FilePriorities: priorities,
    };
  }
}
