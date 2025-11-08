/*
자유 예금: 입금 자유, 출금 자유
정기 예금: 입금 불가, 출금 불가 (만기일 전까지)
자유 적금: 입금 가능, 출금 불가 (만기일 전까지)
정기 적금: 입금 가능(주어진 날짜에만), 출금 불가 (만기일 전까지)
성장주: 배당금 낮음, 변동율 높음
기대주: 배당금 높음, 변동율 낮음
*/


const financialProduct = Object.freeze({
    enum: ['demandDeposit', 'fixedDeposit', 
        'flexibleInstallmentSavings', 'fixedInstallmentSavings', 
        'growthStock', 'dividendStock'],
    /** 자유 예금 */
    demandDeposit: {
        korean: '자유 예금',
        comment: '자유 입출금, 낮은 이자',
        interest: 0.02,
        canDeposit: true,
        canWithdraw: true,
        term: 12,
        maturity: null
    },
    /** 정기 예금 */
    fixedDeposit: { 
        korean: '정기 예금',
        comment: '입출금 불가, 만기일 있음, 높은 이자',
        interest: 0.10,
        canDeposit: false,
        canWithdraw: false,
        maturity: 12
    }, 
    /** 자유 적금 */
    flexibleInstallmentSavings: { 
        korean: '자유 적금',
        comment: '입금 자유, 출금 불가, 만기일 있음, 높은 이자',
        interest: 0.08,
        canDeposit: true,
        canWithdraw: false,
        maturity: 12
    },
    /** 정기 적금 */
    fixedInstallmentSavings: { 
        korean: '정기 적금',
        comment: '정기적 입금(자동 이체), 출금 불가, 만기일 있음, 높은 이자',
        interest: 0.12,
        canDeposit: false,
        canWithdraw: false,
        maturity: 12
    },
    /** 성장주 */
    growthStock: { 
        korean: '성장주',
        comment: '배당금 낮음, 변동율 높음',
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
        korean: '기대주',
        comment: '배당금 높음, 변동율 낮음',
        dividend: 0.07,
        term: 12,
        minChange: -0.05,
        maxChange: 0.10,
        maturity: null,
        canDeposit: true,
        canWithdraw: true
    }
});

module.exports = financialProduct;