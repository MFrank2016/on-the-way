declare module 'lunar-javascript' {
  export class Solar {
    static fromDate(date: Date): Solar
    getLunar(): Lunar
  }

  export class Lunar {
    getDayInChinese(): string
    getMonthInChinese(): string
    getDay(): number
    getJieQi(): string
  }
}

