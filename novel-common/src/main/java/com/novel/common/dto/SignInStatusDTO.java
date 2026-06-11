package com.novel.common.dto;

import java.util.List;

public class SignInStatusDTO {
    private boolean todaySigned;
    private int continuousDays;
    private int totalDays;
    private int todayReward;
    private List<RewardInfo> rewards;

    public SignInStatusDTO() {}

    public SignInStatusDTO(boolean todaySigned, int continuousDays, int totalDays, 
                          int todayReward, List<RewardInfo> rewards) {
        this.todaySigned = todaySigned;
        this.continuousDays = continuousDays;
        this.totalDays = totalDays;
        this.todayReward = todayReward;
        this.rewards = rewards;
    }

    public boolean isTodaySigned() {
        return todaySigned;
    }

    public void setTodaySigned(boolean todaySigned) {
        this.todaySigned = todaySigned;
    }

    public int getContinuousDays() {
        return continuousDays;
    }

    public void setContinuousDays(int continuousDays) {
        this.continuousDays = continuousDays;
    }

    public int getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(int totalDays) {
        this.totalDays = totalDays;
    }

    public int getTodayReward() {
        return todayReward;
    }

    public void setTodayReward(int todayReward) {
        this.todayReward = todayReward;
    }

    public List<RewardInfo> getRewards() {
        return rewards;
    }

    public void setRewards(List<RewardInfo> rewards) {
        this.rewards = rewards;
    }

    public static class RewardInfo {
        private int day;
        private int reward;
        private boolean signed;

        public RewardInfo() {}

        public RewardInfo(int day, int reward, boolean signed) {
            this.day = day;
            this.reward = reward;
            this.signed = signed;
        }

        public int getDay() {
            return day;
        }

        public void setDay(int day) {
            this.day = day;
        }

        public int getReward() {
            return reward;
        }

        public void setReward(int reward) {
            this.reward = reward;
        }

        public boolean isSigned() {
            return signed;
        }

        public void setSigned(boolean signed) {
            this.signed = signed;
        }
    }
}
