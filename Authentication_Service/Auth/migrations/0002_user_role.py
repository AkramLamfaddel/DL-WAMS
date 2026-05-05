from django.db import migrations, models


class Migration(migrations.Migration):
    """Add role field to the User model for RBAC."""

    dependencies = [
        ('Auth', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[('user', 'Standard User'), ('admin', 'Administrator')],
                db_index=True,
                default='user',
                help_text='User role for access control.',
                max_length=10,
            ),
        ),
    ]
