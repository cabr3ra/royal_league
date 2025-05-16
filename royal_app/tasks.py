# Import necessary modules
import random
from celery import shared_task
from .models import Player, DailyPlayer, Career, DailyCareer, Attempt
from datetime import date

# This is a task that Celery will run in the background
@shared_task
def generate_daily_player():
    # Get all players from the database
    all_players = Player.objects.all()

    # Check if there are any players in the database
    if not all_players.exists():
        return "No players found in the database."

    # Check if a daily player has already been created for today
    if DailyPlayer.objects.filter(date=date.today()).exists():
        return "A daily player has already been generated for today."

    # Pick one player randomly from the list of all players
    random_player = random.choice(all_players)

    # Create a new daily player record in the database
    DailyPlayer.objects.create(player=random_player, date=date.today())

    return f"Daily player: {random_player.name}"

# This is another task that Celery will run in the background
@shared_task
def generate_daily_career():
    # Get all players from the database
    all_players = Player.objects.all()

    # Check if there are any players in the database
    if not all_players.exists():
        return "No players found in the database."

    # Check if a daily career has already been created for today
    if DailyCareer.objects.filter(date=date.today()).exists():
        return "A daily career has already been generated for today."

    # Pick one player randomly from the list of all players
    random_player = random.choice(all_players)

    # Get all careers for the randomly selected player
    player_careers = Career.objects.filter(player=random_player)

    # Check if the selected player has any careers recorded
    if not player_careers.exists():
        return f"{random_player.name} has no careers recorded."

    # Save all the player's careers as daily careers
    for career in player_careers:
        DailyCareer.objects.create(
            player=random_player,
            team=career.team,
            season=career.season,
            date=date.today()
        )

    return f"Daily career: {random_player.name}"

@shared_task
def generate_daily_attempts():
    # If it already exists, do nothing; otherwise, create it with 7 attempts.
    attempt, created = Attempt.objects.get_or_create(
        date=date.today(),
        defaults={'attempts': 7}
    )
    if created:
        return f"Created daily attempts for {date.today()} with 7 attempts."
    return f"Daily attempts for {date.today()} already exist."


# from royal_app.tasks import generate_daily_player, generate_daily_career, generate_daily_attempts

# result_player = generate_daily_player.apply()
# print(result_player.get())

# result_career = generate_daily_career.apply()
# print(result_career.get())

# result_attempts = generate_daily_attempts.apply()
# print(result_attempts.get())