import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {ApiService, Torrent, TorrentFile} from '../../api.service';
import {OverlayPanel} from 'primeng/overlaypanel';
import {take} from 'rxjs/operators';

const PRIORITY_SKIP = 0;
const PRIORITY_NORMAL = 4;

@Component({
  selector: 't-file-picker-overlay',
  templateUrl: './file-picker-overlay.component.html',
  styleUrls: ['./file-picker-overlay.component.scss']
})
export class FilePickerOverlayComponent {
  @Input('hash') hash: string;
  @Input('torrent') torrent: Torrent;
  @Output('prioritiesChanged') prioritiesChanged = new EventEmitter<number[]>();

  @ViewChild('overlay') overlay: OverlayPanel;

  fileChecked: boolean[] = [];
  processing = false;

  public toggle($event: Event): void {
    this.initChecked();
    this.overlay.toggle($event, $event.target);
  }

  constructor(private api: ApiService) {
  }

  private initChecked(): void {
    if (!this.torrent?.Files?.length) {
      this.fileChecked = [];
      return;
    }
    this.fileChecked = this.torrent.Files.map((_, i) => {
      const priority = this.torrent.FilePriorities?.[i];
      return priority !== PRIORITY_SKIP;
    });
  }

  public fileName(file: TorrentFile): string {
    const parts = file.Path.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1];
  }

  public onApply(): void {
    const priorities = this.fileChecked.map(checked => checked ? PRIORITY_NORMAL : PRIORITY_SKIP);

    this.processing = true;
    this.api.setTorrentOptions(this.hash, {FilePriorities: priorities}).pipe(
      take(1),
    ).subscribe({
      next: () => {
        this.processing = false;
        this.overlay.hide();
        this.prioritiesChanged.emit(priorities);
      },
      error: () => {
        this.processing = false;
      }
    });
  }
}
