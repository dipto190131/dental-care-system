# Add these endpoints to the end of backend/api/views.py

@csrf_exempt
@require_auth
@require_http_methods(['GET'])
def credit_plans_list(request):
    """Get all active credit plans"""
    plans = CreditPlan.objects.filter(is_active=True).order_by('display_order')
    return JsonResponse([serialize_credit_plan(p) for p in plans], safe=False)


@csrf_exempt
@require_role('admin')
@require_http_methods(['POST'])
def create_credit_plan(request):
    """Create a new credit plan (admin only)"""
    data = parse_body(request)
    name = data.get('name', '').strip()
    credits = data.get('credits')
    price = data.get('price')
    description = data.get('description', '').strip()
    badge = data.get('badge')
    display_order = data.get('displayOrder', 0)
    
    if not name or not credits or not price:
        return JsonResponse({'error': 'name, credits, and price are required'}, status=400)
    
    try:
        credits = int(credits)
        price = int(price)
    except (TypeError, ValueError):
        return JsonResponse({'error': 'credits and price must be numbers'}, status=400)
    
    if credits <= 0 or price <= 0:
        return JsonResponse({'error': 'credits and price must be positive'}, status=400)
    
    plan = CreditPlan.objects.create(
        id=str(uuid.uuid4()),
        name=name,
        credits=credits,
        price=price,
        description=description or None,
        badge=badge or None,
        is_active=True,
        display_order=display_order,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    return JsonResponse(serialize_credit_plan(plan), status=201)


@csrf_exempt
@require_role('admin')
@require_http_methods(['PUT'])
def update_credit_plan(request, plan_id):
    """Update an existing credit plan (admin only)"""
    try:
        plan = CreditPlan.objects.get(id=plan_id)
    except CreditPlan.DoesNotExist:
        return JsonResponse({'error': 'Plan not found'}, status=404)
    
    data = parse_body(request)
    
    if 'name' in data:
        plan.name = data.get('name', '').strip()
    if 'credits' in data:
        try:
            plan.credits = int(data.get('credits'))
        except (TypeError, ValueError):
            return JsonResponse({'error': 'credits must be a number'}, status=400)
    if 'price' in data:
        try:
            plan.price = int(data.get('price'))
        except (TypeError, ValueError):
            return JsonResponse({'error': 'price must be a number'}, status=400)
    if 'description' in data:
        plan.description = data.get('description', '').strip() or None
    if 'badge' in data:
        plan.badge = data.get('badge') or None
    if 'isActive' in data:
        plan.is_active = bool(data.get('isActive'))
    if 'displayOrder' in data:
        try:
            plan.display_order = int(data.get('displayOrder'))
        except (TypeError, ValueError):
            plan.display_order = 0
    
    plan.updated_at = datetime.now()
    plan.save()
    return JsonResponse(serialize_credit_plan(plan))


@csrf_exempt
@require_role('admin')
@require_http_methods(['DELETE'])
def delete_credit_plan(request, plan_id):
    """Delete a credit plan (admin only) - soft delete by marking inactive"""
    try:
        plan = CreditPlan.objects.get(id=plan_id)
    except CreditPlan.DoesNotExist:
        return JsonResponse({'error': 'Plan not found'}, status=404)
    
    # Soft delete: mark as inactive instead of actually deleting
    plan.is_active = False
    plan.updated_at = datetime.now()
    plan.save()
    return JsonResponse({'success': True})
