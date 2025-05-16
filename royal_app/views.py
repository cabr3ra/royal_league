import json
import random
import datetime

from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from django.conf import settings
from django.utils import timezone
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.decorators import api_view

from .models import Player, DailyPlayer, Career, DailyCareer, Attempt
from .serializers import PlayerSerializer, CareerSerializer


class PlayerList(generics.ListCreateAPIView):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer

class PlayerDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer

class CareerList(generics.ListCreateAPIView):
    queryset = Career.objects.all()
    serializer_class = CareerSerializer

# Home page view
def index(request):
    return render(request, "home.html")

# Player page view
def player_view(request):
    return render(request, "player.html")

# Career page view
def career_view(request):
    return render(request, "career.html")

# Clock page view
def clock_view(request):
    return render(request, "clock.html")

# Train page view
def train_view(request):
    return render(request, "train.html")

# Blocks search if no attempts
def block_search(request):
    attempt = Attempt.objects.first()
    if attempt and attempt.attempts == 0:
        return JsonResponse({"error": "No attempts"}, status=403)
    return None

# Search players by name
@api_view(['GET'])
def search_player(request):
    # Check if search is blocked
    block_response = block_search(request)
    if block_response:
        return block_response

    query = request.GET.get('query', '')
    players = Player.objects.filter(name__icontains=query)

    # Serialize the list of players
    serializer = PlayerSerializer(players, many=True)

    return Response(serializer.data)


# Search careers by id
@api_view(['GET'])
def search_career(request):
    # Check if search is blocked
    block_response = block_search(request)
    if block_response:
        return block_response

    player_id = request.GET.get('player_id', '')
    careers = Career.objects.filter(player_id=player_id, season__icontains='Split')
    
    # Serialize the list of careers
    serializer = CareerSerializer(careers, many=True)
    
    return Response(serializer.data)

# Get daily player
@api_view(['GET'])
def get_daily_player(request):
    try:
        daily_player = DailyPlayer.objects.get(date=datetime.date.today())
        player = daily_player.player

        # Reset attempts
        attempt, created = Attempt.objects.get_or_create(id=1)
        attempt.attempts = 7
        attempt.save()

        # Serialize the player
        serializer = PlayerSerializer(player)

        # Add the color field manually (not part of the model/serializer)
        data = serializer.data
        data['color'] = 'black'

        return Response(data)

    except DailyPlayer.DoesNotExist:
        return Response({"error": "There's no daily_player"}, status=404)

# Get daily career
@api_view(['GET'])
def get_daily_career(request):
    try:
        daily_career = DailyCareer.objects.filter(date=datetime.date.today())

        if not daily_career.exists():
            return Response({"error": "No career assigned"}, status=404)

        # Reset attempts
        attempt, _ = Attempt.objects.get_or_create(id=1)
        attempt.attempts = 7
        attempt.save()

        # Create a list to hold the fake Career instances to be serialized
        careers_to_serialize = []
        for dc in daily_career:
            # This is a fake Career instance, not saved to the database
            fake_career = Career(player=dc.player, team=dc.team, season=dc.season)
            careers_to_serialize.append(fake_career)

        serializer = CareerSerializer(careers_to_serialize, many=True)
        return Response(serializer.data)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def get_random_player(request):
    players = Player.objects.all()
    if not players.exists():
        return Response({'error': 'No players available.'}, status=404)

    random_player = random.choice(list(players))
    serializer = PlayerSerializer(random_player)
    return Response(serializer.data)

def compare_format(select_player, daily_player):
    # Check if the selected player is the same as the daily player
    if select_player.id == daily_player.id:
        return {
            "status": "correct",
            "color": "green",
            "message": "¡Jugador acertado!",
            "comparacion": None
        }
    
    # Use compare_detail to get the comparison
    comp = compare_detail(select_player, daily_player)
    return {
        "status": "default",
        "color": "default",
        "message": "",
        "comparacion": comp
    }

# Compare player selected with daily player
@csrf_exempt
def compare_player(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        select_player = Player.objects.get(id=data.get('id'))
        daily_player = DailyPlayer.objects.get(date=datetime.date.today()).player

        evaluation = compare_format(select_player, daily_player)
        
        # Control attempts: if attempts == 0, return daily_player info
        attempt = Attempt.objects.first()
        if attempt.attempts == 0:
            response = {
                'image': daily_player.image,
                'name': daily_player.name,
                'color': 'red',
                'message': '¡Intentos agotados!'
            }
            return JsonResponse(response)
        
        if evaluation["status"] == "correct":
            attempt.attempts = 0
            attempt.save()
            response = {
                'image': daily_player.image,
                'name': daily_player.name,
                'color': evaluation["color"],
                'message': evaluation["message"]
            }
            return JsonResponse(response)
        
        response = {
            'comparacion': evaluation["comparacion"],
            'image': daily_player.image,
            'name': daily_player.name,
            'color': evaluation["color"],
            'message': evaluation["message"]
        }
        return JsonResponse(response)

    except Player.DoesNotExist:
        print("Jugador no encontrado")
        return JsonResponse({"error": "Jugador no encontrado"}, status=404)
    except DailyPlayer.DoesNotExist:
        print("No hay un jugador del día asignado")
        return JsonResponse({"error": "No hay un jugador del día asignado"}, status=404)
    except Exception as e:
        print(f"Error: {e}")
        return JsonResponse({"error": f"Error inesperado: {str(e)}"}, status=500)

@csrf_exempt
@api_view(['POST'])
def compare_career(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        data = json.loads(request.body)
        player_id = data.get("id")
        date_today = datetime.date.today()

        career_day = DailyCareer.objects.filter(date=date_today)
        if not career_day.exists():
            return JsonResponse({"error": "No hay una carrera del día asignada para hoy"}, status=404)

        carrers_player = Career.objects.filter(player_id=player_id)

        careers_day_split = career_day.filter(season__icontains="Split")
        careers_player_split = carrers_player.filter(season__icontains="Split")

        def extract_split_key(season):
            import re
            match = re.search(r"Split (\d+)", season)
            return int(match.group(1)) if match else None

        careers_day_dict = {extract_split_key(c.season): c for c in careers_day_split if extract_split_key(c.season)}
        careers_player_dict = {extract_split_key(c.season): c for c in careers_player_split if extract_split_key(c.season)}

        coincidences = []
        for split_num in careers_day_dict.keys() & careers_player_dict.keys():
            career_day_item = careers_day_dict[split_num]
            career_player = careers_player_dict[split_num]
            if career_player.team == career_day_item.team:
                serializer_day = CareerSerializer(career_day_item)
                serializer_player = CareerSerializer(career_player)

                coincidences.append({
                    "split": split_num,
                    "season": serializer_player.data["season"],
                    "team": serializer_player.data["team"],
                    "career_day": serializer_day.data,
                    "career_player": serializer_player.data
                })

        full_match = int(player_id) in [c.player.id for c in career_day]

        if full_match:
            attempt = Attempt.objects.first()
            if attempt:
                attempt.attempts = 0
                attempt.save()

            return JsonResponse({
                "image": career_day.first().player.image,
                "name": career_day.first().player.name,
                "color": "green",
                "message": "¡Jugador y carrera acertados!",
                "coincidences": coincidences
            })

        elif coincidences:
            # Solo coincidencias parciales
            return JsonResponse({
                "image": career_day.first().player.image,
                "name": career_day.first().player.name,
                "color": "default",
                "message": "",
                "coincidences": coincidences
            })

        else:
            attempt = Attempt.objects.first()
            if attempt and attempt.attempts == 0:
                jugador = career_day.first().player
                return JsonResponse({
                    'color': 'red',
                    'image': jugador.image,
                    'name': jugador.name,
                })

            # Decrementar intentos
            decrement_attempts(request)
            return JsonResponse({
                "comparacion": "No hay coincidencias en equipo y temporada",
                "id": player_id
            })

    except Exception as e:
        return JsonResponse({"error": f"Error inesperado: {str(e)}"}, status=500)

@csrf_exempt
@api_view(['POST'])
def compare_random_player(request):
    try:
        data = request.data
        selected_id = data.get('id')
        random_id = data.get('random_id')

        if not selected_id or not random_id:
            return Response({"error": "Faltan campos 'id' o 'random_id'"}, status=400)

        select_player = Player.objects.get(id=selected_id)
        random_player = Player.objects.get(id=random_id)

        evaluation = compare_format(select_player, random_player)
        serializer = PlayerSerializer(random_player)

        player_data = serializer.data

        response = {
            **player_data,
            'color': evaluation.get("color", "default"),
            'message': evaluation.get("message", ""),
        }

        if evaluation.get("status") != "correct":
            response['comparacion'] = evaluation.get("comparacion")

        return Response(response)

    except Player.DoesNotExist:
        print("Jugador no encontrado")
        return JsonResponse({"error": "Jugador no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": f"Error inesperado: {str(e)}"}, status=500)

# Compare player selected with daily player
def compare_detail(pl_sel, pl_day):
    def compare_age(v_sel, v_day):
        if v_sel > v_day:
            return "Mayor"
        elif v_sel < v_day:
            return "Menor"
        return "Igual"

    def compare_position(pos_sel, pos_day):
        # Secure position are list of strings
        pos_sel_list = pos_sel if isinstance(pos_sel, list) else pos_sel.split(',')
        pos_day_list = pos_day if isinstance(pos_day, list) else pos_day.split(',')
        common_positions = set(pos_sel_list).intersection(set(pos_day_list))
        if common_positions:
            return "Parcial" if len(common_positions) < len(pos_sel_list) else "Igual"
        return "Diferente"
    
    result = {
        "same_player": pl_sel.id == pl_day.id,
        "same_team": pl_sel.current_team_text == pl_day.current_team_text,
        "same_position": compare_position(pl_sel.position, pl_day.position),
        "same_nation": pl_sel.nation_text == pl_day.nation_text,
        "age": compare_age(pl_sel.age, pl_day.age),
    }
    return result

# Get seven attempts
def get_attempts(request):
    attempt, created = Attempt.objects.get_or_create(
        date=datetime.date.today(),
        defaults={'attempts': 7}
    )
    return JsonResponse({'attempts': attempt.attempts})


@csrf_exempt
def decrement_attempts(request):
    if request.method == 'PUT':
        attempt = Attempt.objects.get(date=datetime.date.today())
        if attempt.attempts > 0:
            attempt.attempts -= 1
            attempt.save()
        return JsonResponse({'attempts': attempt.attempts})
    return JsonResponse({"error": "Método no permitido"}, status=405)

@csrf_exempt
def reset_attempts(request):
    if request.method == 'PUT':
        attempt, created = Attempt.objects.get_or_create(
            date=datetime.date.today(),
            defaults={'attempts': 7}
        )
        attempt.attempts = 7
        attempt.save()
        return JsonResponse({'attempts': attempt.attempts})
    return JsonResponse({"error": "Método no permitido"}, status=405)
