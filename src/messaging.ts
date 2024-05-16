import { EventEmitter } from 'node:events';
export class Entry {
  sender: string;
  receiver: string;
  message: string;
  event: string;
  constructor(sender: string, receiver: string, message: string, event: string) {
    this.sender = sender;
    this.receiver = receiver;
    this.message = message;
    this.event = event;
  }
  describePath(): string {
    if (this.event === 'sent') {
      return `[${this.sender}]->[${this.receiver}]`;
    } else {
      return `[${this.sender}]>-[${this.receiver}]`;
    }
  }
}
function createPreamble(): string {
  return `@startuml messages\n`;
}
function createLine(entry: Entry): string {
  const colors: { [key: string]: string } = {
    'probe': 'blue',
    'trace': 'green',
    'meet': 'orange',
    'loop': 'red',
    'have-probes': 'purple',
    'okay-to-send-probes': 'purple',
  };
  if (entry.sender === '---') {
    return '';
  }
  const color = colors[entry.message.toString().split(' ')[0]] || 'black';
  return `${entry.sender} -[#${color}]-> ${entry.receiver}: ${entry.message}\n`;
}
function createEpilogue(): string {
  return '@enduml';
}
export function createPlantUml(log: Entry[]): string {
  return createPreamble() + log.map(line => createLine(line)).join('') + createEpilogue();
}
export class MessageForwarder extends EventEmitter {
  protected links: string[];
  constructor(links: string[]) {
    super();
    this.links = links;
  }

}

export class EarthstarMessageForwarder extends MessageForwarder {
  private log: Entry[] = [];
  constructor(links: string[]) {
    super(links);
  }

  async init(): Promise<void> {
  }
  logMessageSent(sender: string, receiver: string, message: string): void {
    this.log.push(new Entry(sender, receiver, message, 'sent'));
  }
  logMessageReceived(sender: string, receiver: string, message: string): void {
    this.log.push(new Entry(sender, receiver, message, 'received'));
  }
  forwardMessage(sender: string, receiver: string, message: string): void {
    this.logMessageSent(sender, receiver, message);
    this.emit('incoming-message', sender, receiver, message);
  }
  getLocalLog(name: string): string[] {
    return this.log.filter(entry => {
      if (entry.sender === name) {
        return (entry.event === 'sent');
      }
      if (entry.receiver === name) {
        return (entry.event === 'received');
      }
      // istanbul ignore next
      return false;
    }).map(entry => {
      if (entry.event === 'sent') {
        return `TO[${entry.receiver}] ${entry.message.toString()}`;
      } else {
        return `FROM[${entry.sender}] ${entry.message.toString()}`;
      }
    });
  }
  getFullLog(includeEachMessageTwice: boolean = false): string[] {
    const filtered = (includeEachMessageTwice) ? this.log : this.log.filter(entry => entry.event === 'sent');
    return filtered.map(entry => `${entry.describePath()} ${entry.message.toString()}`);
  }
  getPlantUml(): string {
    return createPlantUml(this.log);
  }
}