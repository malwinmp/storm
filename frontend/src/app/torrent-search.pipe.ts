import {Pipe, PipeTransform} from '@angular/core';
import {Label, Torrent} from './api.service';

type LabelledTorrent = Label & Torrent;

@Pipe({
  name: 'torrentSearch'
})
export class TorrentSearchPipe implements PipeTransform {

  private filter(term: string): (t: LabelledTorrent) => boolean {
    return (t: LabelledTorrent): boolean => {

      switch (true) {
        case t.Name.toLowerCase().includes(term):
          return true;
        case t.State.toLowerCase().includes(term):
          return true;
        case t.DownloadLocation.toLowerCase().includes(term):
          return true;
        case t.TrackerHost.toLowerCase().includes(term):
          return true;
        case t.Label.toLowerCase().includes(term):
          return true;
      }

      return false;
    };
  }

  // Accept an optional label to filter by (null/undefined = no label filter)
  transform<T extends LabelledTorrent>(values: Array<T>, term: string, label?: string | null): Array<T> {
    if (!values || !Array.isArray(values) || !term && !label) {
      // If no term and no label just return values
      if (!term && !label) {
        return values;
      }
    }

    let results = values;

    if (term) {
      const predicate = this.filter(term.toLowerCase());
      results = results.filter(predicate);
    }

    if (label) {
      results = results.filter(t => (t.Label || '') === label);
    }

    return results;
  }

}
