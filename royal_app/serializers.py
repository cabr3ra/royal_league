from rest_framework import serializers
from .models import Player, Career, Club

# Serializer for the Player model
class PlayerSerializer(serializers.ModelSerializer):
    image = serializers.CharField()
    number = serializers.IntegerField()
    name = serializers.CharField()
    nation = serializers.SerializerMethodField()
    position = serializers.ListField()
    value_million = serializers.IntegerField()
    height = serializers.CharField()
    current_team = serializers.SerializerMethodField()
    past_teams = serializers.ListField()
    birth_date = serializers.CharField()
    age = serializers.IntegerField()

    class Meta:
        model = Player
        fields = '__all__'

    def get_nation(self, obj):
        return {
            'text': obj.nation_text,
            'image': obj.nation_image
        }

    def get_current_team(self, obj):
        return {
            'text': obj.current_team_text,
            'image': obj.current_team_image
        }

# Serializer for the Career model
class CareerSerializer(serializers.ModelSerializer):
    
    # Fields to be serialized
    player = serializers.SerializerMethodField()
    team = serializers.SerializerMethodField()

    class Meta:
        model = Career
        fields = '__all__'

    def get_team(self, obj):
        if obj.team:
            return {
                "name": obj.team.name,
                "image": obj.team.image
            }
        return None

    def get_player(self, obj):
        player = obj.player
        return {
            "id": player.id,
            "name": player.name,
            "image": player.image
        }
