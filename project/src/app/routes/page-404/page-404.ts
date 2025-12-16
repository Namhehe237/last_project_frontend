import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-page-404',
  imports: [RouterLink],
  templateUrl: './page-404.html',
  styleUrl: './page-404.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Page404 {

}
