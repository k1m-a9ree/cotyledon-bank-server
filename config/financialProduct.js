/*
자유 예금: 입금 자유, 출금 자유
정기 예금: 입금 불가, 출금 불가 (만기일 전까지)
자유 적금: 입금 가능, 출금 불가 (만기일 전까지)
정기 적금: 입금 가능(주어진 날짜에만), 출금 불가 (만기일 전까지)
성장주: 배당금 낮음, 변동율 높음
기대주: 배당금 높음, 변동율 낮음
*/


const financialProduct = Object.freeze({
    enum: ['demandDeposit', 'flexibleInstallmentSavings', 
        'fixedDeposit', 'fixedInstallmentSavings',
        'growthStock', 'dividendStock', 'gold', 'property'],
    /** 자유 예금 */
    demandDeposit: {
        stage: 1,
        rootType: '예금',
        korean: '자유 예금',
        comment: ['자유 입출금', '낮은 이자'],
        detail: ['이자 2%', '만기일 없음'],
        interest: 0.02,
        canDeposit: true,
        canWithdraw: true,
        term: 12,
        maturity: null
    },
    /** 정기 예금 */
    fixedDeposit: {
        stage: 3,
        rootType: '예금',
        korean: '정기 예금',
        comment: ['입출금 불가', '만기일 있음', '높은 이자'],
        detail: ['이자 10%', '만기일 12시간'],
        interest: 0.10,
        canDeposit: false,
        canWithdraw: false,
        maturity: 12
    },
    /** 자유 적금 */
    flexibleInstallmentSavings: {
        stage: 2,
        rootType: '적금',
        korean: '자유 적금',
        comment: ['입금 자유', '출금 불가', '만기일 있음', '높은 이자'],
        detail: ['이자 8%', '만기일 12시간'],
        interest: 0.08,
        canDeposit: true,
        canWithdraw: false,
        maturity: 12
    },
    /** 정기 적금 */
    fixedInstallmentSavings: {
        stage: 4,
        rootType: '적금',
        korean: '정기 적금',
        comment: ['정기적 입금(자동 이체)', '출금 불가', '만기일 있음', '높은 이자'],
        detail: ['이자 12%', '만기일 12시간'],
        interest: 0.12,
        canDeposit: false,
        canWithdraw: false,
        maturity: 12
    },
    /** 성장주 */
    growthStock: {
        stage: 5,
        rootType: '주식',
        korean: '성장주',
        comment: ['배당금 낮음', '변동율 높음'],
        detail: ['배당금 0.5%'],
        dividend: 0.005,
        term: 12,
        minChange: -0.20,
        maxChange: 0.30,
        maturity: null,
        canDeposit: true,
        canWithdraw: true
    },
    /** 기대주 */
    dividendStock: {
        stage: 6,
        rootType: '주식',
        korean: '기대주',
        comment: ['배당금 높음', '변동율 낮음'],
        detail: ['배당금 7%'],
        dividend: 0.07,
        term: 12,
        minChange: -0.05,
        maxChange: 0.10,
        maturity: null,
        canDeposit: true,
        canWithdraw: true
    },
    /** 금 */
    gold: {
        stage: 7,
        rootType: '실물자산',
        korean: '금',
        comment: ['방어적'],
        detail: [],
        dividend: 0,
        term: 12,
        minChange: -0.05,
        maxChange: 0.20,
        maturity: null,
        canDeposit: true,
        canWithdraw: true
    },
    /** 부동산 */
    property: {
        stage: 8,
        rootType: '실물자산',
        korean: '부동산',
        comment: ['월세 임대 수익', '낮은 변동성'],
        detail: ['임대 수익 3%'],
        dividend: 0.03,
        term: 12,
        minChange: -0.02,
        maxChange: 0.08,
        maturity: null,
        canDeposit: true,
        canWithdraw: true
    }
});

module.exports = financialProduct;