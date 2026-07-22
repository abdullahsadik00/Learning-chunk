/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function (nums, target) {
    let result = []
    for (let i = 1; i < nums.length; i++) {
        if (nums[i] + nums[i - 1] == target) {
            result.push(i - 1)
            result.push(i)
        }
    }
    return result
};


/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function (nums) {
    let currentSum = 0;
    let maxSum = 0;
    for (let i = 0; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i])

        maxSum = Math.max(currentSum, maxSum)
    }
    return maxSum
};

/**
 * @param {number[]} nums
 * @return {void} Do not return anything, modify nums in-place instead.
 */
var moveZeroes = function (nums) {
    let insertPos = 0;
    for (let i = 0; i < nums.length; i++) {
        if (nums[i] != 0) {
            nums[insertPos] = nums[i]
            insertPos++
        }
    }
    while (insertPos < nums.length) {
        nums[insertPos] = 0
        insertPos++
    }

    return nums
};

/**
* @param {number[]} prices
* @return {number}
*/
var maxProfit = function (prices) {
    let sell = 0;
    let buy = prices[0];
    let profit = 0;
    for (let i = 1; i < prices.length; i++) {
        if (buy > prices[i]) {
            buy = prices[i]
        } else {
            profit = Math.max(profit, prices[i] - buy)
        }
    }

    return profit
};