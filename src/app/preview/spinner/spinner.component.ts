import { Component, OnInit, OnChanges, Input } from '@angular/core';

@Component({
  selector: 'amp-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss']
})
export class SpinnerComponent implements OnInit, OnChanges {

  @Input() public numberOfDots = 3;
  @Input() public message: string;
  public dots: number[];

  lastMessage: string;
  newMessage: boolean;
  oldMessage: boolean;

  constructor() {
  }

  ngOnChanges(changes) {
    if (changes.message) {
      this.lastMessage = changes.message.previousValue;
      this.newMessage = true;
      if (this.lastMessage != null) {
        this.oldMessage = true;
      }
      setTimeout(() => {
        this.newMessage = false;
        this.oldMessage = false;
      }, 1);
    }
  }

  ngOnInit() {
    this.dots = [];
    for (let i = 0; i < this.numberOfDots; i++) {
      this.dots.push(i);
    }
  }

}
