from django.db import models
from datetime import date

# Info about a player
class Player(models.Model):
    image = models.URLField(null=True, blank=True)
    number = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=255)
    nation_text = models.CharField(max_length=255, null=True, blank=True)
    nation_image = models.URLField(null=True, blank=True)
    position = models.JSONField(default=list)
    value_million = models.IntegerField(null=True, blank=True)
    height = models.CharField(max_length=255)
    current_team_text = models.CharField(max_length=255)
    current_team_image = models.URLField(null=True, blank=True)
    past_teams = models.CharField(max_length=255)
    birth_date = models.CharField(max_length=255)
    age = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.name

# A player's time with a team
class Career(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    team = models.ForeignKey('Club', on_delete=models.CASCADE)
    season = models.CharField(max_length=255)

    def __str__(self):
        return f'{self.team} - {self.season}'

# Info about a club
class Club(models.Model):
    name = models.CharField(max_length=255, unique=True)
    image = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.name

# The player chosen for the day
class DailyPlayer(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.player.name} - {self.date}"

# The player's career info chosen for the day
class DailyCareer(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    team = models.ForeignKey('Club', on_delete=models.CASCADE)
    season = models.CharField(max_length=255)
    date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.player.name} - {self.team} ({self.season})"

# Number of tries allowed
class Attempt(models.Model):
    attempts = models.IntegerField(default=7)
    date = models.DateField(default=date.today)

    def __str__(self):
        return f"Attempts: {self.attempts}"
