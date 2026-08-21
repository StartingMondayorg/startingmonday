import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import {
  addBundleItem,
  assignBundleToPartner,
  createBundleTemplate,
  createCatalogPrice,
  createCatalogProduct,
  setCatalogProductStatus,
} from './actions'
import { Button, Card, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from '@/components/ui'
function createOpsClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}

export const metadata = { title: 'Micro-Product Catalog - Admin' }

export default async function AdminMicroProductCatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const isReadOnly = staff.role === 'viewer'

  const ops = createOpsClient()

  const [productsResult, pricesResult, bundlesResult, bundleItemsResult, entitlementsResult] = await Promise.all([
    ops.from('micro_products').select('id, slug, name, summary, channel, persona, product_status, billing_type, default_interval, display_order').order('display_order', { ascending: true }),
    ops.from('micro_product_prices').select('id, micro_product_id, stripe_product_id, stripe_price_id, stripe_coupon_id, interval, unit_amount_cents, is_active, created_at').order('created_at', { ascending: false }),
    ops.from('micro_product_bundles').select('id, slug, name, audience, bundle_status, seat_min, stripe_product_id, stripe_price_id, stripe_coupon_id').order('created_at', { ascending: false }),
    ops.from('micro_product_bundle_items').select('id, bundle_id, micro_product_id, entitlement_key, included, created_at').order('created_at', { ascending: false }),
    ops.from('account_entitlements').select('id, user_id, partner_id, micro_product_id, source_bundle_id, entitlement_key, seat_limit, status, starts_at, ends_at').order('created_at', { ascending: false }).limit(20),
  ])

  const products = (productsResult.data ?? []) as Array<{
    id: string
    slug: string
    name: string
    summary: string
    channel: string
    persona: string | null
    product_status: string
    billing_type: string
    default_interval: string
    display_order: number
  }>

  const prices = (pricesResult.data ?? []) as Array<{
    id: string
    micro_product_id: string
    stripe_product_id: string
    stripe_price_id: string
    stripe_coupon_id: string | null
    interval: string
    unit_amount_cents: number
    is_active: boolean
    created_at: string
  }>

  const bundles = (bundlesResult.data ?? []) as Array<{
    id: string
    slug: string
    name: string
    audience: string
    bundle_status: string
    seat_min: number
    stripe_product_id: string | null
    stripe_price_id: string | null
    stripe_coupon_id: string | null
  }>

  const bundleItems = (bundleItemsResult.data ?? []) as Array<{
    id: string
    bundle_id: string
    micro_product_id: string
    entitlement_key: string
    included: boolean
  }>

  const entitlements = (entitlementsResult.data ?? []) as Array<{
    id: string
    user_id: string | null
    partner_id: string | null
    micro_product_id: string
    source_bundle_id: string | null
    entitlement_key: string
    seat_limit: number
    status: string
    starts_at: string
    ends_at: string | null
  }>

  const productNameById = new Map(products.map((p) => [p.id, p.name]))
  const bundleNameById = new Map(bundles.map((b) => [b.id, b.name]))

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-primary-foreground">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/product" className="text-[12px] font-semibold text-primary-foreground hover:text-primary-foreground">Product Hub</Link>
            <Link href="/dashboard/admin" className="text-[12px] font-semibold text-primary-foreground">Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<h1 className="text-[26px] font-bold text-foreground">Micro-Product Catalog</h1>
        <p className="text-[13px] text-muted-foreground mt-1.5 mb-6">
          Sprint 4 back office for micro-product pricing, bundle templates, and entitlement mapping.
        </p>

        <section className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          <Card className="p-4">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Products</p>
            <p className="text-[22px] font-bold text-foreground mt-1">{products.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Active prices</p>
            <p className="text-[22px] font-bold text-foreground mt-1">{prices.filter((p) => p.is_active).length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Bundles</p>
            <p className="text-[22px] font-bold text-foreground mt-1">{bundles.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Entitlements</p>
            <p className="text-[22px] font-bold text-foreground mt-1">{entitlements.length}</p>
          </Card>
        </section>

        {!isReadOnly && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <form action={createCatalogProduct}>
              <Card className="p-5 grid grid-cols-1 gap-2">
                <h2 className="text-[12px] font-semibold text-foreground mb-1">Create micro-product</h2>
                <Input name="slug" placeholder="slug" required />
                <Input name="name" placeholder="name" required />
                <Textarea name="summary" placeholder="summary" rows={3} required />
                <div className="grid grid-cols-2 gap-2">
                  <Select name="channel" defaultValue="executives">
                    <SelectTrigger aria-label="Product channel" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executives">executives</SelectItem>
                      <SelectItem value="coaches">coaches</SelectItem>
                      <SelectItem value="outplacement">outplacement</SelectItem>
                      <SelectItem value="search_firms">search_firms</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input name="persona" placeholder="persona" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Select name="product_status" defaultValue="draft">
                    <SelectTrigger aria-label="Product status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">draft</SelectItem>
                      <SelectItem value="active">active</SelectItem>
                      <SelectItem value="retired">retired</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select name="billing_type" defaultValue="one_time">
                    <SelectTrigger aria-label="Billing type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">one_time</SelectItem>
                      <SelectItem value="subscription">subscription</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select name="default_interval" defaultValue="one_time">
                    <SelectTrigger aria-label="Default billing interval" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">one_time</SelectItem>
                      <SelectItem value="month">month</SelectItem>
                      <SelectItem value="year">year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input name="display_order" type="number" placeholder="display order" defaultValue={100} />
                <Button type="submit" className="mt-1 self-start">Create product</Button>
              </Card>
            </form>

            <form action={createCatalogPrice}>
              <Card className="p-5 grid grid-cols-1 gap-2">
                <h2 className="text-[12px] font-semibold text-foreground mb-1">Attach Stripe price</h2>
                <Select name="micro_product_id" required>
                  <SelectTrigger aria-label="Micro-product" className="w-full">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input name="stripe_product_id" placeholder="stripe product id" required />
                <Input name="stripe_price_id" placeholder="stripe price id" required />
                <Input name="stripe_coupon_id" placeholder="stripe coupon id (optional)" />
                <div className="grid grid-cols-2 gap-2">
                  <Select name="interval" defaultValue="one_time">
                    <SelectTrigger aria-label="Price interval" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">one_time</SelectItem>
                      <SelectItem value="month">month</SelectItem>
                      <SelectItem value="year">year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input name="unit_amount_cents" type="number" min={1} placeholder="unit amount cents" required />
                </div>
                <Button type="submit" className="mt-1 self-start">Attach price</Button>
              </Card>
            </form>
          </section>
        )}

        {!isReadOnly && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <form action={createBundleTemplate}>
              <Card className="p-5 grid grid-cols-1 gap-2">
                <h2 className="text-[12px] font-semibold text-foreground mb-1">Create bundle template</h2>
                <Input name="slug" placeholder="bundle slug" required />
                <Input name="name" placeholder="bundle name" required />
                <div className="grid grid-cols-3 gap-2">
                  <Select name="audience" defaultValue="b2b">
                    <SelectTrigger aria-label="Bundle audience" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="b2b">b2b</SelectItem>
                      <SelectItem value="b2c">b2c</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select name="bundle_status" defaultValue="draft">
                    <SelectTrigger aria-label="Bundle status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">draft</SelectItem>
                      <SelectItem value="active">active</SelectItem>
                      <SelectItem value="retired">retired</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input name="seat_min" type="number" min={1} defaultValue={1} placeholder="minimum seats" />
                </div>
                <Input name="stripe_product_id" placeholder="stripe product id" />
                <Input name="stripe_price_id" placeholder="stripe price id" />
                <Input name="stripe_coupon_id" placeholder="stripe coupon id" />
                <Button type="submit" className="mt-1 self-start">Create bundle</Button>
              </Card>
            </form>

            <div className="space-y-4">
              <form action={addBundleItem}>
                <Card className="p-5 grid grid-cols-1 gap-2">
                  <h2 className="text-[12px] font-semibold text-foreground mb-1">Add bundle item</h2>
                  <Select name="bundle_id" required>
                    <SelectTrigger aria-label="Bundle template" className="w-full">
                      <SelectValue placeholder="Select bundle" />
                    </SelectTrigger>
                    <SelectContent>
                      {bundles.map((bundle) => (
                        <SelectItem key={bundle.id} value={bundle.id}>{bundle.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select name="micro_product_id" required>
                    <SelectTrigger aria-label="Bundle micro-product" className="w-full">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input name="entitlement_key" placeholder="entitlement key" required />
                  <Button type="submit" className="mt-1 self-start">Attach to bundle</Button>
                </Card>
              </form>

              <form action={assignBundleToPartner}>
                <Card className="p-5 grid grid-cols-1 gap-2">
                  <h2 className="text-[12px] font-semibold text-foreground mb-1">Assign bundle to partner</h2>
                  <Input name="partner_email" placeholder="partner email" required />
                  <Select name="bundle_id" required>
                    <SelectTrigger aria-label="Assign bundle template" className="w-full">
                      <SelectValue placeholder="Select bundle" />
                    </SelectTrigger>
                    <SelectContent>
                      {bundles.map((bundle) => (
                        <SelectItem key={bundle.id} value={bundle.id}>{bundle.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input name="seat_limit" type="number" min={1} defaultValue={5} placeholder="seat limit" />
                  <Button type="submit" className="mt-1 self-start">Assign entitlements</Button>
                </Card>
              </form>
            </div>
          </section>
        )}

        <Card className="p-0 overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-[12px] font-semibold text-foreground">Catalog products</h2>
          </div>
          <Table className="text-[12px]">
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="px-5 py-2">Product</TableHead>
                <TableHead className="px-4 py-2">Channel</TableHead>
                <TableHead className="px-4 py-2">Billing</TableHead>
                <TableHead className="px-4 py-2">Status</TableHead>
                <TableHead className="px-5 py-2 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="px-5 py-2 text-foreground whitespace-normal">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-muted-foreground">{product.slug}</p>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-muted-foreground">{product.channel}</TableCell>
                  <TableCell className="px-4 py-2 text-muted-foreground">{product.billing_type} / {product.default_interval}</TableCell>
                  <TableCell className="px-4 py-2 text-muted-foreground">{product.product_status}</TableCell>
                  <TableCell className="px-5 py-2 text-right">
                    {!isReadOnly && (
                      <form action={setCatalogProductStatus} className="inline-flex items-center gap-2">
                        <input type="hidden" name="id" value={product.id} />
                        <Select name="product_status" defaultValue={product.product_status}>
                          <SelectTrigger aria-label="Update product status" size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">draft</SelectItem>
                            <SelectItem value="active">active</SelectItem>
                            <SelectItem value="retired">retired</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="submit" variant="outline" size="sm">Save</Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card className="p-5">
            <h2 className="text-[12px] font-semibold text-foreground mb-3">Active Stripe prices</h2>
            <div className="space-y-2 text-[12px]">
              {prices.length === 0 && <p className="text-muted-foreground">No pricing records yet.</p>}
              {prices.slice(0, 12).map((price) => (
                <div key={price.id} className="border-b border-border pb-2">
                  <p className="font-semibold text-foreground">{productNameById.get(price.micro_product_id) ?? price.micro_product_id}</p>
                  <p className="text-muted-foreground">{price.stripe_price_id}</p>
                  <p className="text-muted-foreground">{formatMoney(price.unit_amount_cents)} / {price.interval}{price.stripe_coupon_id ? ` (${price.stripe_coupon_id})` : ''}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-[12px] font-semibold text-foreground mb-3">Bundle items</h2>
            <div className="space-y-2 text-[12px]">
              {bundleItems.length === 0 && <p className="text-muted-foreground">No bundle items yet.</p>}
              {bundleItems.slice(0, 16).map((item) => (
                <div key={item.id} className="border-b border-border pb-2">
                  <p className="font-semibold text-foreground">{bundleNameById.get(item.bundle_id) ?? item.bundle_id}</p>
                  <p className="text-muted-foreground">{productNameById.get(item.micro_product_id) ?? item.micro_product_id}</p>
                  <p className="text-muted-foreground">{item.entitlement_key}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <Card className="p-5">
          <h2 className="text-[12px] font-semibold text-foreground mb-3">Recent entitlement assignments</h2>
          <div className="space-y-2 text-[12px]">
            {entitlements.length === 0 && <p className="text-muted-foreground">No entitlement rows yet.</p>}
            {entitlements.map((entitlement) => (
              <div key={entitlement.id} className="border-b border-border pb-2">
                <p className="font-semibold text-foreground">
                  {productNameById.get(entitlement.micro_product_id) ?? entitlement.micro_product_id}
                </p>
                <p className="text-muted-foreground">
                  {entitlement.partner_id ? `partner:${entitlement.partner_id}` : `user:${entitlement.user_id}`}
                  {entitlement.source_bundle_id ? ` via ${bundleNameById.get(entitlement.source_bundle_id) ?? entitlement.source_bundle_id}` : ''}
                </p>
                <p className="text-muted-foreground">{entitlement.entitlement_key} - seats {entitlement.seat_limit} - {entitlement.status}</p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}

