import click
from flask import current_app
from app import app
from models.models import db, Seed, SeedPrice
from services.market import MarketService
from datetime import datetime, timedelta
import sys

@click.group()
def cli():
    """SeedMart Market Management CLI"""
    pass

@cli.command()
@click.option('--days', default=365, help='Number of days of historical data to generate')
def init_market(days):
    """Initialize market with historical price data"""
    with app.app_context():
        try:
            # Check if we already have price data
            if SeedPrice.query.first():
                if not click.confirm('Price data already exists. Do you want to clear and regenerate?'):
                    click.echo('Aborted.')
                    return
                
                # Clear existing price data
                click.echo('Clearing existing price data...')
                SeedPrice.query.delete()
                db.session.commit()
            
            click.echo(f'Generating {days} days of historical price data...')
            seeds = Seed.query.all()
            
            with click.progressbar(seeds) as progress_seeds:
                for seed in progress_seeds:
                    # Generate base price between 1-6 dollars
                    base_price = MarketService.calculate_base_price()
                    end_date = datetime.now()
                    start_date = end_date - timedelta(days=days)
                    
                    # Generate daily prices
                    current_date = start_date
                    current_price = base_price
                    
                    while current_date <= end_date:
                        # Calculate next price using market service
                        current_price = MarketService.calculate_price_change(current_price)
                        
                        # Create price record
                        price_record = SeedPrice(
                            seed_id=seed.id,
                            price=current_price,
                            volume=MarketService.generate_volume(),
                            recorded_at=current_date
                        )
                        db.session.add(price_record)
                        
                        current_date += timedelta(days=1)
            
            db.session.commit()
            click.echo('Done! Market initialized successfully.')
            
        except Exception as e:
            click.echo(f'Error: {str(e)}', err=True)
            db.session.rollback()
            sys.exit(1)

@cli.command()
def update_prices():
    """Manually trigger a price update for all seeds"""
    with app.app_context():
        try:
            updates = MarketService.update_seed_prices()
            click.echo(f'Successfully updated prices for {updates} seeds.')
        except Exception as e:
            click.echo(f'Error: {str(e)}', err=True)
            sys.exit(1)

@cli.command()
@click.argument('seed_id', type=int)
def show_seed_stats(seed_id):
    """Show market statistics for a specific seed"""
    with app.app_context():
        try:
            seed = Seed.query.get(seed_id)
            if not seed:
                click.echo(f'Error: Seed with ID {seed_id} not found.', err=True)
                sys.exit(1)
            
            # Get latest price
            latest_price = (SeedPrice.query
                          .filter_by(seed_id=seed_id)
                          .order_by(SeedPrice.recorded_at.desc())
                          .first())
            
            # Get price statistics
            prices = [p.price for p in seed.prices]
            avg_price = sum(prices) / len(prices) if prices else 0
            min_price = min(prices) if prices else 0
            max_price = max(prices) if prices else 0
            
            click.echo(f'\nMarket Statistics for {seed.name} ({seed.species})')
            click.echo('-' * 50)
            click.echo(f'Current Price: ${latest_price.price:.2f}')
            click.echo(f'Average Price: ${avg_price:.2f}')
            click.echo(f'Price Range: ${min_price:.2f} - ${max_price:.2f}')
            click.echo(f'Total Volume: {sum(p.volume for p in seed.prices):,}')
            
        except Exception as e:
            click.echo(f'Error: {str(e)}', err=True)
            sys.exit(1)

if __name__ == '__main__':
    cli()