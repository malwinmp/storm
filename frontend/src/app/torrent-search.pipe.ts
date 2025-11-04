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

  // Accept an optional label to filter by (null/undefined = no label filter; '' = filter "no label")
  transform<T extends LabelledTorrent>(values: Array<T>, term: string, label?: string | null): Array<T> {
    if (!values || !Array.isArray(values)) {
      return values;
    }

    // If no search term and label is null/undefined => no filtering (All)
    if (!term && (label === null || typeof label === 'undefined')) {
      return values;
    }

    let results = values;

    if (term) {
      const predicate = this.filter(term.toLowerCase());
      results = results.filter(predicate);
    }

    if (label !== null && typeof label !== 'undefined') {
      // '' means "No label" (torrents where Label is empty or unset)
      if (label === '') {
        results = results.filter(t => !(t.Label && t.Label.length));
      } else {
        results = results.filter(t => (t.Label || '') === label);
      }
    }

    return results;
  }

}
