import {ChangeDetectionStrategy, Component, input, OnInit, output} from '@angular/core';


export interface TabInterface {
	name: string;
	value: string;
	typeCode?: string;
}


@Component({
  selector: 'app-card-header',
  imports: [],
  templateUrl: './card-header.component.html',
  styleUrl: './card-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardHeaderComponent implements OnInit {
  readonly tabList = input<TabInterface[]>()
  readonly type = input<string>()
  readonly title = input<string>()
  readonly currentTab = input<TabInterface>()
  readonly count = input<number>()
	tabSelected = output<TabInterface>();
  protected name = ''

  ngOnInit(): void {
    this.name = Math.random().toString();
  }

	onChange(item: TabInterface){
		this.tabSelected.emit(item);
	}
}
