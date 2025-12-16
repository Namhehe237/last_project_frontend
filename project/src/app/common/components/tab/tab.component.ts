import { ChangeDetectionStrategy, Component, input, OnInit, output } from '@angular/core';


export interface TabInterface {
	name: string;
	value: string;
	typeCode?: string;
}


@Component({
  selector: 'app-tab',
  imports: [],
  templateUrl: './tab.component.html',
  styleUrl: './tab.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabComponent implements OnInit {
	readonly tabList = input.required<TabInterface[]>()
  readonly currentTab = input.required<TabInterface>()

	tabSelected = output<TabInterface>();
  protected name = ''

  ngOnInit(): void {
    this.name = Math.random().toString();
  }

	onChange(item: TabInterface){
		this.tabSelected.emit(item);
	}
}
