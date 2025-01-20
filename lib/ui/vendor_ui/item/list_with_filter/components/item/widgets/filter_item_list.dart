import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../../../../core/vendor/api/common/ps_status.dart';
import '../../../../../../../core/vendor/constant/ps_constants.dart';
import '../../../../../../../core/vendor/provider/product/search_product_provider.dart';
import '../../../../../../../core/vendor/utils/ps_animation.dart';
import '../../../../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../../../../core/vendor/viewobject/product.dart';
import '../../../../../../custom_ui/item/list_item/product_vertical_list_item.dart';
import '../../../../../../custom_ui/item/list_item/product_vertical_list_item_for_filter.dart';
import '../../../../../../custom_ui/item/list_with_filter/components/item/widgets/item_list_empty_box.dart';
import '../../../../../common/ps_admob_native_widget.dart';

class ItemListView extends StatefulWidget {
  const ItemListView(
      {Key? key, required this.animationController, required this.isGrid})
      : super(key: key);
  final AnimationController animationController;
  final bool isGrid;
  @override
  State<ItemListView> createState() => _ItemListViewState();
}

class _ItemListViewState extends State<ItemListView>
    with SingleTickerProviderStateMixin {
  // final ScrollController _controller = ScrollController();
  late SearchProductProvider _provider;
  PsValueHolder? valueHolder;

  @override
  void initState() {
    super.initState();
    // _controller.addListener(() {
    //   if (_controller.position.pixels == _controller.position.maxScrollExtent) {
    //     _provider.loadNextDataList();
    //   }
    // });
  }

  @override
  Widget build(BuildContext context) {
    _provider = Provider.of<SearchProductProvider>(context);
    valueHolder = Provider.of<PsValueHolder>(context, listen: false);
    final bool isLoading = _provider.currentStatus == PsStatus.BLOCK_LOADING;
    final int count = isLoading
        ? valueHolder!.loadingShimmerItemCount!
        : _provider.dataLength;

    if (_provider.hasData || _provider.currentStatus == PsStatus.PROGRESS_LOADING ||
        _provider.currentStatus == PsStatus.BLOCK_LOADING) {
      if (!widget.isGrid) {
        return SliverList(
          delegate: SliverChildBuilderDelegate(
            (BuildContext context, int index) {
              if (!isLoading &&
                  _provider.productList.data![index].adType ==
                      PsConst.GOOGLE_AD_TYPE) {
                return const PsAdMobNativeWidget();
              } else {
                return CustomProductVeticalListItemForFilter(
                  isLoading: isLoading,
                  coreTagKey: _provider.hashCode.toString(),
                  product: isLoading
                      ? Product()
                      : _provider.productList.data![index],
                  animation: curveAnimation(widget.animationController,
                      index: index, count: count),
                  animationController: widget.animationController,
                );
              }
            },
            childCount: count,
          ),
        );
      } else {
        return SliverGrid(
          gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 280.0,
              childAspectRatio: valueHolder!.isShowOwnerInfo! ? 0.65 : 0.77),
          delegate: SliverChildBuilderDelegate(
            (BuildContext context, int index) {
              if (!isLoading &&
                  _provider.productList.data![index].adType ==
                      PsConst.GOOGLE_AD_TYPE) {
                return const PsAdMobNativeWidget();
              } else {
                return CustomProductVeticalListItem(
                  isLoading: isLoading,
                  coreTagKey: _provider.hashCode.toString(),
                  product: isLoading
                      ? Product()
                      : _provider.productList.data![index],
                  animation: curveAnimation(widget.animationController,
                      index: index, count: count),
                  animationController: widget.animationController,
                );
              }
            },
            childCount: count,
          ),
        );
      }
    } else
      return SliverToBoxAdapter(child: CustomItemListEmptyBox());
  }
}
